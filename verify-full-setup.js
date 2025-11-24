
const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

// Manually parse .env.local to avoid dependency issues if dotenv is missing
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '.env.local');
        if (!fs.existsSync(envPath)) {
            console.error("❌ .env.local file not found!");
            return {};
        }
        const content = fs.readFileSync(envPath, 'utf8');
        const env = {};
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[key] = value;
            }
        });
        console.log("   ℹ️  Found keys:", Object.keys(env));
        return env;
    } catch (e) {
        console.error("❌ Error loading .env.local:", e);
        return {};
    }
}

const env = loadEnv();
const uri = env.MONGODB_URI;

console.log("--- Verification Report ---");
console.log(`1. Environment Loading:`);
if (uri) {
    console.log(`   ✅ MONGODB_URI found: ${uri}`);
} else {
    console.log(`   ❌ MONGODB_URI NOT found in .env.local`);
    console.log("   File content preview:");
    console.log(fs.readFileSync('.env.local', 'utf8').substring(0, 100) + "...");
    process.exit(1);
}

async function run() {
    console.log(`2. Database Connection:`);
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("   ✅ Connected successfully to MongoDB");

        const db = client.db(); // Uses the db from the URI
        console.log(`   ℹ️  Database Name: ${db.databaseName}`);

        const collections = await db.listCollections().toArray();
        console.log(`   ℹ️  Collections: ${collections.map(c => c.name).join(', ')}`);

        const users = db.collection('users');
        const adminUser = await users.findOne({ username: 'admin' });

        console.log(`3. User Check:`);
        if (adminUser) {
            console.log(`   ✅ User 'admin' found.`);
        } else {
            console.log(`   ❌ User 'admin' NOT found.`);
        }

    } catch (err) {
        console.error("   ❌ Connection failed:", err.message);
    } finally {
        await client.close();
    }
}

run();
