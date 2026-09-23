
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sadiarafiquedev_db_user:KhmXmAyYP9SxabFR@cluster0.yhrbvje.mongodb.net/ride_and_serve')
.then(async () => {
  const db = mongoose.connection.client.db('ride_and_serve');
  const driver = await db.collection('drivers').findOne({ Name: /sarim/i });
  console.log('Driver driverPhoto:', JSON.stringify(driver.driverPhoto, null, 2));
  console.log('Driver profilePic:', JSON.stringify(driver.profilePic, null, 2));
  process.exit(0);
});

