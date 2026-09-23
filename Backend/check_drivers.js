require("dotenv").config();
const mongoose = require("mongoose");
const DBurl = process.env.MONGO_URL;

mongoose.connect(DBurl).then(async () => {
    try {
        const drivers = await mongoose.connection.collection('drivers').find({}).toArray();
        let badDrivers = drivers.filter(d => typeof d.availability === 'string');
        console.log(`Total bad drivers: ${badDrivers.length}`);
        badDrivers.forEach(d => console.log(d._id, d.availability));
        
        // Let's aggressively update anything that doesn't have an object for availability
        const result = await mongoose.connection.collection('drivers').updateMany(
            { availability: { $type: "string" } },
            { $set: { 
                "availability": {
                    "scheduleType": "same",
                    "specificDays": [],
                    "slots": []
                }
            } }
        );
        console.log("Update result:", result);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
