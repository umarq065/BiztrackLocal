
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = "mongodb://localhost:27017/biztrack";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("biztrack-pro");
        const users = db.collection("users");

        const username = "admin";
        const password = "password123";
        const passwordHash = await bcrypt.hash(password, 10);

        const existingUser = await users.findOne({ username });
        if (existingUser) {
            console.log(`User '${username}' already exists.`);
            await users.updateOne({ username }, { $set: { passwordHash } });
            console.log(`Password for '${username}' updated to '${password}'.`);
        } else {
            await users.insertOne({ username, passwordHash });
            console.log(`User '${username}' created with password '${password}'.`);
        }

    } finally {
        await client.close();
    }
}

run().catch(console.dir);
