require("dotenv").config();
const mongoose = require("mongoose");
const DBurl = process.env.MONGO_URL;

mongoose.connect(DBurl).then(async () => {
    console.log("Connected to DB, fixing Driver records...");
    try {
        const drivers = await mongoose.connection.collection('drivers').find({ 
            availability: { $type: "string" } 
        }).toArray();
        
        console.log(`Found ${drivers.length} drivers with string availability.`);

        const result = await mongoose.connection.collection('drivers').updateMany(
            { availability: { $type: "string" } },
            { $set: { 
                "availability": {
                    "scheduleType": "same",
                    "specificDays": [],
                    "slots": []
                },
                "status": "On Trip" // Storing the string status somewhere else safely if we want, or just let it go
            } }
        );
        console.log("Update result:", result);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
