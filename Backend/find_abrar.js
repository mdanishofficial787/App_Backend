require('dotenv').config();
const mongoose = require('mongoose');

async function checkAbrar() {
  await mongoose.connect(process.env.MONGO_URL);
  const db = mongoose.connection.db;

  const collections = ['requests', 'riderequests', 'assignments', 'rides'];
  for (const c of collections) {
    const docs = await db.collection(c).find({
      $or: [
        { customerName: /abrar/i },
        { passengerName: /abrar/i },
        { 'customer.fullName': /abrar/i },
        { name: /abrar/i }
      ]
    }).toArray();
    console.log(`\n--- Collection: ${c} (count: ${docs.length}) ---`);
    for (const d of docs) {
      console.log(JSON.stringify(d, null, 2));
    }
  }

  await mongoose.disconnect();
}
checkAbrar().catch(console.error);
