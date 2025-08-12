// Temporary file to output all user information individually
// This should be run in the browser console or as a standalone script

// Function to fetch all users from Auth0 Management API
async function getAllUsers() {
  try {
    // Get the Auth0 domain from environment or hardcode for testing
    const domain = process.env.REACT_APP_AUTH0_DOMAIN || "login.asksaividya.com";
    
    // Get Management API token from environment variable
    const managementToken = process.env.REACT_APP_AUTH0_MANAGEMENT_TOKEN || "YOUR_MANAGEMENT_API_TOKEN";
    
    if (managementToken === "YOUR_MANAGEMENT_API_TOKEN") {
      throw new Error("Please set REACT_APP_AUTH0_MANAGEMENT_TOKEN in your .env.local file");
    }
    
    const response = await fetch(`https://${domain}/api/v2/users`, {
      headers: {
        'Authorization': `Bearer ${managementToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

// Function to output individual user information
function outputUserInfo(users) {
  console.log(`=== TOTAL USERS: ${users.length} ===\n`);
  
  users.forEach((user, index) => {
    console.log(`=== USER ${index + 1} ===`);
    console.log(`User ID: ${user.user_id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Email Verified: ${user.email_verified}`);
    console.log(`Name: ${user.name || 'Not provided'}`);
    console.log(`Nickname: ${user.nickname || 'Not provided'}`);
    console.log(`Given Name: ${user.given_name || 'Not provided'}`);
    console.log(`Family Name: ${user.family_name || 'Not provided'}`);
    console.log(`Picture: ${user.picture || 'No picture'}`);
    console.log(`Created At: ${user.created_at}`);
    console.log(`Updated At: ${user.updated_at}`);
    console.log(`Last Login: ${user.last_login || 'Never logged in'}`);
    console.log(`Login Count: ${user.logins_count || 0}`);
    console.log(`Blocked: ${user.blocked}`);
    
    // Phone information
    if (user.phone_number) {
      console.log(`Phone Number: ${user.phone_number}`);
      console.log(`Phone Verified: ${user.phone_verified}`);
    }
    
    // Address information
    if (user.user_metadata && user.user_metadata.address) {
      console.log(`Address: ${JSON.stringify(user.user_metadata.address)}`);
    }
    
    // App metadata
    if (user.app_metadata) {
      console.log(`App Metadata: ${JSON.stringify(user.app_metadata)}`);
    }
    
    // User metadata
    if (user.user_metadata) {
      console.log(`User Metadata: ${JSON.stringify(user.user_metadata)}`);
    }
    
    // Identities (social logins, etc.)
    if (user.identities && user.identities.length > 0) {
      console.log(`Identities:`);
      user.identities.forEach((identity, i) => {
        console.log(`  ${i + 1}. Provider: ${identity.provider}, User ID: ${identity.user_id}`);
      });
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
  });
}

// Function to output users in JSON format
function outputUsersJSON(users) {
  console.log('=== ALL USERS IN JSON FORMAT ===');
  console.log(JSON.stringify(users, null, 2));
}

// Function to output specific user by email
function findUserByEmail(users, email) {
  const user = users.find(u => u.email === email);
  if (user) {
    console.log(`=== USER FOUND: ${email} ===`);
    console.log(JSON.stringify(user, null, 2));
  } else {
    console.log(`No user found with email: ${email}`);
  }
}

// Function to output users created in last 30 days
function getRecentUsers(users) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentUsers = users.filter(user => {
    const createdDate = new Date(user.created_at);
    return createdDate > thirtyDaysAgo;
  });
  
  console.log(`=== RECENT USERS (Last 30 days): ${recentUsers.length} ===`);
  recentUsers.forEach(user => {
    console.log(`${user.email} - Created: ${user.created_at}`);
  });
}

// Function to output users by verification status
function getUsersByVerificationStatus(users) {
  const verified = users.filter(user => user.email_verified);
  const unverified = users.filter(user => !user.email_verified);
  
  console.log(`=== VERIFIED USERS: ${verified.length} ===`);
  verified.forEach(user => console.log(user.email));
  
  console.log(`\n=== UNVERIFIED USERS: ${unverified.length} ===`);
  unverified.forEach(user => console.log(user.email));
}

// Main execution function
async function main() {
  console.log('Fetching all users...');
  const users = await getAllUsers();
  
  if (users.length === 0) {
    console.log('No users found or error occurred');
    return;
  }
  
  // Output individual user information
  outputUserInfo(users);
  
  // Output in JSON format
  outputUsersJSON(users);
  
  // Find specific user (replace with actual email)
  // findUserByEmail(users, 'user@example.com');
  
  // Get recent users
  getRecentUsers(users);
  
  // Get users by verification status
  getUsersByVerificationStatus(users);
}

// Export functions for use in other files
export {
  getAllUsers,
  outputUserInfo,
  outputUsersJSON,
  findUserByEmail,
  getRecentUsers,
  getUsersByVerificationStatus
};

// Run if this file is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.getAllUsers = getAllUsers;
  window.outputUserInfo = outputUserInfo;
  window.outputUsersJSON = outputUsersJSON;
  window.findUserByEmail = findUserByEmail;
  window.getRecentUsers = getRecentUsers;
  window.getUsersByVerificationStatus = getUsersByVerificationStatus;
  window.runUserList = main;
  
  console.log('User list functions loaded. Run runUserList() to execute.');
} else {
  // Node.js environment
  main();
} 