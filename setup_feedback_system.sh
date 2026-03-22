#!/bin/bash

# Feedback System Setup Script
# This script will fix the common issues with the feedback system

echo "🔧 Setting up Feedback System..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Create .env.local file for frontend
print_status "Creating .env.local file for frontend..."
if [ ! -f ".env.local" ]; then
    echo "REACT_APP_BASE_API_SERVER=http://localhost:8000" > .env.local
    print_success "Created .env.local file"
else
    print_warning ".env.local already exists"
fi

# Step 2: Create .env file for backend
print_status "Creating .env file for backend..."
if [ ! -f ".env" ]; then
    echo "MONGO_URI=mongodb://localhost:27017/" > .env
    print_success "Created .env file for backend"
else
    print_warning ".env already exists"
fi

# Step 3: Check if Python is installed
print_status "Checking Python installation..."
if command -v python3 &> /dev/null; then
    print_success "Python 3 is installed"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    print_success "Python is installed"
    PYTHON_CMD="python"
else
    print_error "Python is not installed. Please install Python 3.7+"
    exit 1
fi

# Step 4: Install Python dependencies
print_status "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    $PYTHON_CMD -m pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        print_success "Python dependencies installed"
    else
        print_error "Failed to install Python dependencies"
        exit 1
    fi
else
    print_error "requirements.txt not found"
    exit 1
fi

# Step 5: Check if MongoDB is running
print_status "Checking MongoDB status..."
if command -v mongod &> /dev/null; then
    # Try to connect to MongoDB
    if $PYTHON_CMD -c "from pymongo import MongoClient; MongoClient('mongodb://localhost:27017/').admin.command('ping')" 2>/dev/null; then
        print_success "MongoDB is running"
    else
        print_warning "MongoDB is not running. Starting MongoDB..."
        # Try to start MongoDB (this might not work on all systems)
        if command -v brew &> /dev/null; then
            brew services start mongodb-community 2>/dev/null || brew services start mongodb 2>/dev/null
        elif command -v systemctl &> /dev/null; then
            sudo systemctl start mongod 2>/dev/null
        else
            print_warning "Could not automatically start MongoDB. Please start it manually."
        fi
    fi
else
    print_warning "MongoDB is not installed. Please install MongoDB first."
    print_status "You can install MongoDB using:"
    echo "  - macOS: brew install mongodb-community"
    echo "  - Ubuntu: sudo apt-get install mongodb"
    echo "  - Or download from: https://www.mongodb.com/try/download/community"
fi

# Step 6: Check if Node.js is installed
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    print_success "Node.js is installed"
else
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Step 7: Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
    if [ $? -eq 0 ]; then
        print_success "Node.js dependencies installed"
    else
        print_error "Failed to install Node.js dependencies"
        exit 1
    fi
else
    print_error "package.json not found"
    exit 1
fi

# Step 8: Create a startup script
print_status "Creating startup script..."
cat > start_feedback_system.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Feedback System..."

# Start the backend server
echo "Starting backend server..."
python3 feedback_server.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend
echo "Starting frontend..."
npm start &
FRONTEND_PID=$!

echo "✅ Feedback system started!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop the system, run:"
echo "kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "Or press Ctrl+C to stop both"

# Wait for user to stop
wait
EOF

chmod +x start_feedback_system.sh
print_success "Created startup script: start_feedback_system.sh"

# Step 9: Create a test script
print_status "Creating test script..."
cat > test_feedback_system.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing Feedback System..."

# Test 1: Check if backend is running
echo "Testing backend server..."
if curl -s http://localhost:8000/api/feedback > /dev/null; then
    echo "✅ Backend server is running"
else
    echo "❌ Backend server is not running"
    echo "Please start the backend server first:"
    echo "python3 feedback_server.py"
    exit 1
fi

# Test 2: Run the automated test
echo "Running automated tests..."
npm run test:feedback

echo "✅ Testing complete!"
EOF

chmod +x test_feedback_system.sh
print_success "Created test script: test_feedback_system.sh"

# Final instructions
echo ""
print_success "Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Start MongoDB (if not already running):"
echo "   - macOS: brew services start mongodb-community"
echo "   - Ubuntu: sudo systemctl start mongod"
echo ""
echo "2. Start the feedback system:"
echo "   ./start_feedback_system.sh"
echo ""
echo "3. Test the system:"
echo "   ./test_feedback_system.sh"
echo ""
echo "4. Or run tests manually:"
echo "   npm run test:feedback"
echo ""
echo "🌐 The system will be available at:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend: http://localhost:8000"
echo "" 