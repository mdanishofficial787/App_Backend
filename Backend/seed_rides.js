require("dotenv").config();
const mongoose = require("mongoose");
const DBurl = process.env.MONGO_URL;

mongoose.connect(DBurl).then(async () => {
    try {
        const customer = await mongoose.connection.collection('customers').findOne({});
        await createDummyRides(customer._id);
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});

async function createDummyRides(customerId) {
    const rides = [
        {
            customer: customerId,
            rideId: "RIDE_" + Date.now() + Math.random(),
            pickupLocation: { address: "JLT Cluster V", lat: 25.0700, lng: 55.1400 },
            dropoffLocation: { address: "Internet City", lat: 25.0900, lng: 55.1600 },
            status: "pending",
            fare: 35,
            rideType: "One-Time Ride",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            customer: customerId,
            rideId: "RIDE_" + Date.now() + Math.random(),
            pickupLocation: { address: "Dubai Mall", lat: 25.0700, lng: 55.1400 },
            dropoffLocation: { address: "JBR", lat: 25.0900, lng: 55.1600 },
            status: "pending",
            fare: 50,
            rideType: "Monthly Pass",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ];

    const result = await mongoose.connection.collection('rides').insertMany(rides);
    console.log(`Inserted \${result.insertedCount} dummy pending rides!`);
}
