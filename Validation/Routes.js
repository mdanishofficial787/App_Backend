const Joi = require("joi");

const preferredRouteValidation = Joi.object({
    startLocation: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        address: Joi.string().required(),
    }).required(),

    endLocation: Joi.object({
        latitude: Joi.number().required(),
        longitude: Joi.number().required(),
        address: Joi.string().required(),
    }).required(),

    preferredTime: Joi.string().required(),
});

module.exports = preferredRouteValidation;