"use strict";
exports.__esModule = true;
var signup_1 = require("./signup");
/**
 * Adds route objects to application middleware.
 * @param app Express application object.
 */
function initializeRoutes(app) {
    app.use("/signup", (0, signup_1["default"])());
}
exports["default"] = initializeRoutes;
