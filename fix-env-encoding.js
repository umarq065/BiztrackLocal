
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const content = `MONGODB_URI=mongodb://localhost:27017/biztrack-pro
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
SECRET_COOKIE_PASSWORD=complex_password_at_least_32_characters_long_random_string_here
`;

fs.writeFileSync(envPath, content, 'utf8');
console.log("✅ .env.local rewritten with clean UTF-8 encoding.");
