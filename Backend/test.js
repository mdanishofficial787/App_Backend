
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://sadiarafiquedev_db_user:KhmXmAyYP9SxabFR@cluster0.yhrbvje.mongodb.net/ride_and_serve')
.then(async () => {
  const db = mongoose.connection.client.db('ride_and_serve');
  const asgs = await db.collection('assignments').find().sort({_id:-1}).limit(5).toArray();
  console.log('Top 5 assignments:', asgs.map(a => ({ _id: a._id, status: a.status, requestId: a.requestId })));
  process.exit(0);
});

