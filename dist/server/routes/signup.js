"use strict";
exports.__esModule = true;
var express = require("express");
var router = express.Router();
/**
 * Initializes endpoints for /signup route.
 * @returns Router object.
 */
function signupRoute() {
    /**
     * Endpoint for accepting and verifying requests to create a new user account.
     */
    router.post("/", function (req, res) {
        return res.sendStatus(200);
    });
    return router;
}
exports["default"] = signupRoute;
