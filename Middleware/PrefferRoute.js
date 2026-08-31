const preferredRouteValidation = require("../Validation/Routes");

const validatePreferredRoute = (req, res, next) => {
    const { error } = preferredRouteValidation.validate(req.body);

    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
        });
    }

    next();
};

module.exports = validatePreferredRoute;