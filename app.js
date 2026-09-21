require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const DriverRoute = require("./Routes/driverRoute");
const VehicleRoute = require("./Routes/vehicle_Route");
const PasswordRoute = require("./Routes/password_Route");
const AdminRoute = require("./Routes/Admin_Route");
const AdminPassword = require("./Routes/AdminPassword");
const AutoLoginRoute = require("./Routes/AutoLogin_Route");
const preferredRoute = require("./Routes/PrefferRoute");
const availabilityRoute = require("./Routes/Availbity_Route");
const rideRoute = require("./Routes/RideRoutes");
const MatchRoute = require("./Routes/MatchRoute");
const DriverReportRoute = require("./Routes/DriverReport_Routes");

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
app.use("/admin", AdminRoute);
app.use("/admin", AdminPassword);
app.use("/driver", AutoLoginRoute);
app.use("/Ride", preferredRoute);
app.use("/availability", availabilityRoute);
app.use("/ride", rideRoute);
app.use("/route", MatchRoute);
app.use("/driver-report", DriverReportRoute);

// 4. Home Route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Ride & Serve API is running",
  });
});
app.listen(8001, () => {
  console.log("Server is running on port 8001");
});