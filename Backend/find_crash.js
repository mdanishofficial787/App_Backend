require("dotenv").config();
const mongoose = require("mongoose");
const DBurl = process.env.MONGO_URL;
const Driver = require("./schema/Driver");

mongoose.connect(DBurl).then(async () => {
    try {
        const drivers = await mongoose.connection.collection('drivers').find({}).toArray();
        for (let d of drivers) {
            try {
                const doc = new Driver(d, true); // init from DB data
            } catch (e) {
                console.error("Crash on driver:", d._id);
                console.error(e.message);
                console.error("Driver data:", JSON.stringify(d, null, 2));
            }
        }
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});
