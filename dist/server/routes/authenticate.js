"use strict";
exports.__esModule = true;
var express = require("express");
var auth_1 = require("../middleware/auth");
var router = express.Router();
function authenticateRoute() {
    router.get("/", auth_1["default"], function (req, res) {
        return res.sendStatus(200);
    });
    return router;
}
exports["default"] = authenticateRoute;
