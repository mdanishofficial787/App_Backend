require("dotenv").config();
const mongoose = require("mongoose");
const DBurl = process.env.MONGO_URL;

mongoose.connect(DBurl).then(async () => {
    try {
        const drivers = await mongoose.connection.collection('drivers').find({}).toArray();
        let suspicious = [];
        for (let d of drivers) {
            // deeply search for the string "On Trip" in the driver document
            let str = JSON.stringify(d);
            if (str.includes("On Trip")) {
                suspicious.push(d);
            }
        }
        console.log(`Suspicious drivers: ${suspicious.length}`);
        suspicious.forEach(d => {
            console.log(d._id, d.availability);
        });
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
