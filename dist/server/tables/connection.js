"use strict";
exports.__esModule = true;
var sequelize_1 = require("sequelize");
var dotenv = require("dotenv");
dotenv.config();
var sequelize = new sequelize_1.Sequelize(process.env.DB_URI);
try {
    sequelize.authenticate().then(function () {
        console.log("Connection to database successful.");
    });
}
catch (exc) {
    console.log(exc);
}
exports["default"] = sequelize;
