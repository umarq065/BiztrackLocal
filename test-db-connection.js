
const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017/biztrack-pro";
const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to server");
        const db = client.db("biztrack-pro");
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));
    } catch (err) {
        console.error("Connection failed:", err.message);
    } finally {
        await client.close();
    }
}

run();
