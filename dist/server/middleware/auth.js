"use strict";
exports.__esModule = true;
var jwt = require("jsonwebtoken");
var dotenv = require("dotenv");
dotenv.config();
/**
 * Middleware for authenticating client requests.
 */
function auth(req, res, next) {
    var authCookie = req.cookies["cookie.auth"];
    // If cookie named cookie.auth could not be found in cookie header, respond with 401.
    if (!authCookie) {
        return res.status(401).json({
            message: "Failed to authenticate user."
        });
    }
    // Verify cookie with jwt secret
    jwt.verify(authCookie, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).json({
                message: "Failed to authenticate user."
            });
        }
        // Respond with 401 if not valid.
        if (!decoded) {
            return res.status(401).json({
                message: "Failed to authenticate user."
            });
        }
        // Continue request to next middleware/endpoint if all conditionals pass.
        return next();
    });
}
exports["default"] = auth;
