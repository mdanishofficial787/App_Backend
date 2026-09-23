const mongoose=require('mongoose'); 
require('dotenv').config(); 
mongoose.connect(process.env.MONGO_URL).then(async () => { 
    const db=mongoose.connection.db; 
    await db.collection('riderequests').updateOne(
        {_id: new mongoose.Types.ObjectId('6a9fe00ef5bc8b5739f389e7')}, 
        {'$set': {driver: '6a9800c7750c0890a9ae6904', driverId: '6a9800c7750c0890a9ae6904'}}
    ); 
    console.log('Successfully injected Khan Sadiqa into the riderequest!'); 
    process.exit(0); 
});
