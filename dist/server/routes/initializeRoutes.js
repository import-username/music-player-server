"use strict";
exports.__esModule = true;
var signup_1 = require("./signup");
var login_1 = require("./login");
var authenticate_1 = require("./authenticate");
/**
 * Adds route objects to application middleware.
 * @param app Express application object.
 */
function initializeRoutes(app) {
    app.use("/signup", (0, signup_1["default"])());
    app.use("/login", (0, login_1["default"])());
    app.use("/authenticate", (0, authenticate_1["default"])());
}
exports["default"] = initializeRoutes;
