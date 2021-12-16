"use strict";
exports.__esModule = true;
var connection_1 = require("./connection");
var sequelize_1 = require("sequelize");
var User = connection_1["default"].define("User", {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: sequelize_1.DataTypes.STRING
    },
    password: {
        type: sequelize_1.DataTypes.STRING
    }
}, { tableName: "users", timestamps: false });
User.sync();
exports["default"] = User;
