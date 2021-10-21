"use strict";
exports.__esModule = true;
var express = require("express");
var PORT = parseInt(process.env.PORT) || 5000;
var app = express();
app.get("/", function (req, res) {
    res.status(200).json({
        message: "response!"
    });
});
app.listen(PORT, "0.0.0.0", function () {
    console.log("Server listening on port " + PORT + "...");
});
