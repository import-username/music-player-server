"use strict";
exports.__esModule = true;
var express = require("express");
var initializeRoutes_1 = require("./routes/initializeRoutes");
var PORT = parseInt(process.env.PORT) || 5000;
var app = express();
(0, initializeRoutes_1["default"])(app);
app.get("/", function (req, res) {
    return res.status(200).json({
        message: "response!"
    });
});
app.listen(PORT, "0.0.0.0", function () {
    console.log("Server listening on port " + PORT + "...");
});
