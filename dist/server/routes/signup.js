"use strict";
exports.__esModule = true;
var express = require("express");
var Users = require("../tables/users");
var bcrypt = require("bcrypt");
var router = express.Router();
router.use(express.json());
/**
 * Initializes endpoints for /signup route.
 * @returns Router object.
 */
function signupRoute() {
    /**
     * Endpoint for accepting and verifying requests to create a new user account.
     */
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
        // Query for row with email from users table.
        Users.findByEmail(req.body.email, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }
            // Respond with 401 if row is found.
            if (user) {
                return res.status(401).json({
                    message: "User with that email already exists."
                });
            }
            // Hash and salt password if user is not found.
            bcrypt.hash(req.body.password, 10, function (err, hash) {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }
                // Query database to create new user row in users table.
                Users.save(req.body.email, hash, function (err, result) {
                    if (err) {
                        return res.status(500).json({
                            message: "Internal server error."
                        });
                    }
                    return res.status(200).json({
                        message: "Account created."
                    });
                });
            });
        });
    });
    return router;
}
exports["default"] = signupRoute;
