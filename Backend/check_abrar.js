require("dotenv").config();
const mongoose = require("mongoose");
async function check() {
  await mongoose.connect(process.env.MONGO_URL, { dbName: 'ride_and_serve' });
  const db = mongoose.connection.client.db('ride_and_serve');
  const rides = await db.collection('riderequests').find({}).toArray();
  console.log("Rides count: " + rides.length);
  rides.forEach(r => {
      console.log(`ID: ${r._id}, customerName: ${r.customerName || r.passenger?.name || r.passengerName || ''}, assignedDriver: ${r.assignedDriver}, status: ${r.status}`);
  });
  process.exit(0);
}
check();
