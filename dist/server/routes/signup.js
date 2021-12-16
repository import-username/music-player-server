"use strict";
exports.__esModule = true;
var express = require("express");
var user_1 = require("../tables/user");
var bcrypt = require("bcrypt");
var router = express.Router();
router.use(express.json());
function signupRoute() {
    router.post("/", function (req, res) {
        if (!(req.body.email) || !(req.body.password)) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }
        if (req.body.password.length < 8) {
            return res.status(401).json({
                message: "Password must be at least 8 characters."
            });
        }
        user_1["default"].findOne({
            where: {
                email: req.body.email
            }
        }).then(function (query) {
            if (query) {
                return res.status(401).json({
                    message: "User with that email already exists."
                });
            }
            bcrypt.hash(req.body.password, 10, function (err, hash) {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }
                user_1["default"].create({
                    email: req.body.email,
                    password: hash
                }).then(function (create) {
                    return res.status(200).json({
                        message: "Account created."
                    });
                })["catch"](function (saveError) {
                    console.error("Internal server error: ", saveError.message);
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                });
            });
        })["catch"](function (err) {
            console.error("Internal server error: ", err.message);
            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });
    return router;
}
exports["default"] = signupRoute;
