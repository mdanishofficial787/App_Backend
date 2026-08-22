require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const DriverRoute = require("./Routes/driverRoute");
const VehicleRoute = require("./Routes/vehicle_Route");
const PasswordRoute = require("./Routes/password_Route");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Connect to MongoDB
const DBurl = process.env.MONGO_URL;
main().
  then(() => {
    console.log("MongoDb Altas Connect")
  }).catch((err) => {
    console.log(err)
  })
async function main() {
  await mongoose.connect(DBurl)
}

// 3. Register Routes
app.use("/driver", DriverRoute);
app.use("/vehicle", VehicleRoute);
app.use("/password", PasswordRoute);
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Ride & Serve API is running",
  });
});
app.listen(8001, () => {
  console.log("Server is running on port 8001");
});