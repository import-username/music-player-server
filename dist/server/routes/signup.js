"use strict";
exports.__esModule = true;
var express = require("express");
var Users = require("../tables/users");
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
        Users.findByEmail(req.body.email, function (err, user) {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }
            if (user) {
                return res.status(401).json({
                    message: "User with that email already exists."
                });
            }
            // TODO insert user into database here
            return res.status(200).json({
                message: "Account created."
            });
        });
    });
    return router;
}
exports["default"] = signupRoute;
