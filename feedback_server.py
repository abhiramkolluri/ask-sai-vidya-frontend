from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client['saividya']  # database name
feedback_collection = db['feedback']  # collection name

def process_citations(citations):
    """Process citations to ensure they're in the correct format"""
    if not citations:
        return []
    
    processed_citations = []
    for citation in citations:
        processed_citation = {
            'title': citation.get('title', ''),
            'collection': citation.get('collection', ''),
            'date': citation.get('date', ''),
            'content': citation.get('content', ''),
            'source_id': citation.get('_id', '')
        }
        processed_citations.append(processed_citation)
    return processed_citations

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    try:
        feedback_data = request.json
        
        # Process citations
        feedback_data['citations'] = process_citations(feedback_data.get('citations', []))
        
        # Add timestamp if not provided
        if 'timestamp' not in feedback_data:
            feedback_data['timestamp'] = datetime.utcnow().isoformat()
            
        # Insert feedback into MongoDB
        result = feedback_collection.insert_one(feedback_data)
        
        return jsonify({
            'success': True,
            'message': 'Feedback submitted successfully',
            'feedback_id': str(result.inserted_id)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    try:
        # Get all feedback entries
        feedback_entries = list(feedback_collection.find({}, {'_id': 0}))
        return jsonify({
            'success': True,
            'feedback': feedback_entries
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=8000) 