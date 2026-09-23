require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const customerRoutes = require("./Route/signup");
const welcomeRoute = require("./Route/welcome");
//const referralRoutes = require("./Route/ReferralRoute");
const termConditionRoute = require("./Route/termCondition");
const OtpRoute = require("./Route/OtpRoute");
const imageRoute = require("./Route/uploadpick");
const loginRoute = require("./Route/LoginRoute");
const forgotPasswordRoute = require("./Route/ForgotPasswordRoute");

// Driver Routes
const driverRoutes = require("./Route/driverRoute");
const vehicleRoutes = require("./Route/vehicle_Route");
const driverPasswordRoutes = require("./Route/driver_password_Route");
const driverAdminRoutes = require("./Route/driver_Admin_Route");
const adminAuthRoutes = require("./Route/adminAuthRoute");
const rideRoutes = require("./Route/rideRoute");

const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1") || origin.startsWith("http://10.0.2.2")) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Connect to MongoDB
const DBurl = process.env.MONGO_URL;
main().
then(()=>{
  console.log("MongoDb Altas Connect")
}).catch((err)=>{
  console.log(err)
})
async function main(){
  await mongoose.connect(DBurl, { dbName: 'ride_and_serve' })
}

// 3. Register Routes (Customer & Common)
app.use("/", welcomeRoute);
app.use("/api/auth", customerRoutes);
app.use("/api/auth", imageRoute);
app.use("/api/auth", OtpRoute);
app.use("/api/legal", termConditionRoute);
app.use("/api/auth", loginRoute);
app.use("/api/auth", forgotPasswordRoute);

// 4. Register Routes (Driver & Vehicle)
app.use("/driver", driverRoutes);
app.use("/api/driver", driverRoutes);
app.use("/vehicle", vehicleRoutes);
app.use("/password", driverPasswordRoutes);
app.use("/admin/auth", adminAuthRoutes);
app.use("/admin", driverAdminRoutes);
app.use("/api/ride", rideRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/requests", rideRoutes);

//app.use("/api/referral", referralRoutes);

// 5. Socket.IO & HTTP Server Setup
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket.IO client connected:", socket.id);

  socket.on("join-driver", (driverId) => {
    if (driverId) {
      socket.join(driverId.toString());
      socket.join(`driver_${driverId}`);
      console.log(`Driver ${driverId} joined socket room`);
    }
  });

  socket.on("join-customer", (customerId) => {
    if (customerId) {
      socket.join(customerId.toString());
      socket.join(`customer_${customerId}`);
      console.log(`Customer ${customerId} joined socket room`);
    }
  });

  socket.on("join", (room) => {
    if (room) {
      socket.join(room.toString());
      console.log(`Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on("join-room", (room) => {
    if (room) {
      socket.join(room.toString());
      console.log(`Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket.IO client disconnected:", socket.id);
  });
});

app.set("io", io);

server.listen(3000, () => {
  console.log("Unified Backend Server with Socket.IO is running on port 3000");
});