require("dotenv").config();
const mongoose = require("mongoose");
const DBurl = process.env.MONGO_URL;

mongoose.connect(DBurl).then(async () => {
    try {
        const result = await mongoose.connection.collection('drivers').find({
            availability: { $type: "string" }
        }).toArray();
        console.log("Drivers with string availability:", result.length);
        result.forEach(d => console.log(d._id, d.availability));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
