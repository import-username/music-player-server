"use strict";
exports.__esModule = true;
var express = require("express");
var user_1 = require("../tables/user");
var bcrypt = require("bcrypt");
var jwt = require("jsonwebtoken");
var dotenv = require("dotenv");
dotenv.config();
var router = express.Router();
router.use(express.json());
function loginRoute() {
    router.post("/", function (req, res) {
        if (!(req.body.email) || !(req.body.password)) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }
        user_1["default"].findOne({
            where: {
                email: req.body.email
            }
        }).then(function (query) {
            if (!query) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }
            var user = query.get();
            bcrypt.compare(req.body.password, user.password, function (err, validPassword) {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }
                if (!validPassword) {
                    return res.status(401).json({
                        message: "Invalid email or password."
                    });
                }
                var JWT = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "31d" });
                var cookieOptions = {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 * 722
                };
                return res.status(200).cookie("cookie.auth", JWT, cookieOptions).json({
                    message: "Successfully logged in."
                });
            });
        })["catch"](function (err) {
            console.error("Internal server error:", err.message);
            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });
    return router;
}
exports["default"] = loginRoute;
