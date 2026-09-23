const mongoose=require('mongoose'); 
require('dotenv').config(); 
mongoose.connect(process.env.MONGO_URL).then(async () => { 
    const db=mongoose.connection.client.db('test'); 
    await db.collection('drivers').updateMany(
        { availability: { $type: "string" } }, 
        { $set: { availability: { scheduleType: 'same', specificDays: [], slots: [] } } }
    ); 
    console.log('Fixed all corrupted drivers!'); 
    process.exit(0); 
});
