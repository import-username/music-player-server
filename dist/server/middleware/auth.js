"use strict";
exports.__esModule = true;
var jwt = require("jsonwebtoken");
var dotenv = require("dotenv");
dotenv.config();
function auth(req, res, next) {
    var authCookie = req.cookies["cookie.auth"];
    if (!authCookie) {
        return res.status(401).json({
            message: "Failed to authenticate user."
        });
    }
    jwt.verify(authCookie, process.env.JWT_SECRET, function (err, decoded) {
        if (err) {
            return res.status(401).json({
                message: "Failed to authenticate user."
            });
        }
        if (!decoded) {
            return res.status(401).json({
                message: "Failed to authenticate user."
            });
        }
        req.user = {
            id: decoded.id
        };
        return next();
    });
}
exports["default"] = auth;
