require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL).then(async () => {
    try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections in DB:");
        collections.forEach(c => console.log(c.name));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});
