const express = require("express");
const router = express.Router();
const Authr = require("../Middleware/Authr");
const validatePreferredRoute = require("../Middleware/PrefferRoute");
const controller = require("../Controller/PrefferRouteController");

router.post(
    "/preferred-route",
    Authr,
    validatePreferredRoute,
    controller.createPreferredRoute
);

router.get(
    "/preferred-route",
    Authr,
    controller.getPreferredRoutes
);

router.get(
    "/preferred-route/:id",
    Authr,
    controller.getPreferredRouteById
);

router.put(
    "/preferred-route/:id",
    Authr,
    validatePreferredRoute,
    controller.updatePreferredRoute
);

router.delete(
    "/preferred-route/:id",
    Authr,
    controller.deletePreferredRoute
);

module.exports = router;