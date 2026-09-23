
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sadiarafiquedev_db_user:KhmXmAyYP9SxabFR@cluster0.yhrbvje.mongodb.net/ride_and_serve')
.then(async () => {
  const db = mongoose.connection.client.db('ride_and_serve');
  const drivers = await db.collection('drivers').find({ Name: /sarim/i }).limit(1).toArray();
  console.log('Driver:', JSON.stringify(drivers, null, 2));
  process.exit(0);
});

