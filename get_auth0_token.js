// Script to generate Auth0 Management API token
// You'll need your Auth0 domain, client ID, and client secret

const https = require('https');

async function getManagementToken() {
  const domain = 'login.asksaividya.com'; // Your Auth0 domain
  const clientId = '6satcFsIaqEedHaMNO65bGZ61TdjcqlB'; // Your client ID
  const clientSecret = 'YOUR_CLIENT_SECRET'; // You need to get this from Auth0 dashboard
  
  const data = JSON.stringify({
    client_id: clientId,
    client_secret: clientSecret,
    audience: `https://${domain}/api/v2/`,
    grant_type: 'client_credentials',
    scope: 'read:users read:user_idp_tokens'
  });

  const options = {
    hostname: domain,
    port: 443,
    path: '/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.access_token) {
            console.log('✅ Management API Token Generated Successfully!');
            console.log('Token:', result.access_token);
            console.log('Expires in:', result.expires_in, 'seconds');
            resolve(result.access_token);
          } else {
            console.error('❌ Failed to get token:', result);
            reject(result);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Instructions for getting client secret
console.log('🔧 To get your Auth0 Management API token:');
console.log('');
console.log('1. Go to your Auth0 Dashboard');
console.log('2. Navigate to Applications → Your App');
console.log('3. Go to Settings tab');
console.log('4. Copy the "Client Secret"');
console.log('5. Replace "YOUR_CLIENT_SECRET" in this file');
console.log('6. Run: node get_auth0_token.js');
console.log('');
console.log('⚠️  WARNING: Never commit your client secret to version control!');
console.log('');

// Uncomment the line below after adding your client secret
// getManagementToken().then(token => console.log('Use this token in temp_user_list.js')).catch(console.error); 