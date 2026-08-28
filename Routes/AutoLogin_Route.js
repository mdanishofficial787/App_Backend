const express = require("express");
const router = express.Router();

const Authr = require("../Middleware/Authr");

const {
    autoLogin
} = require("../Controller/AutoLoginController");

router.get(
    "/auto-login",
    Authr,
    autoLogin
);

module.exports = router;