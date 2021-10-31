"use strict";
exports.__esModule = true;
var signup_1 = require("./signup");
var login_1 = require("./login");
var authenticate_1 = require("./authenticate");
var song_1 = require("./song");
function initializeRoutes(app) {
    app.use("/signup", (0, signup_1["default"])());
    app.use("/login", (0, login_1["default"])());
    app.use("/authenticate", (0, authenticate_1["default"])());
    app.use("/song", (0, song_1["default"])());
}
exports["default"] = initializeRoutes;
