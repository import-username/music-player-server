"use strict";
exports.__esModule = true;
var pg = require("pg");
var dotenv = require("dotenv");
dotenv.config();
var connectionConfiguration = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_ALIAS,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT)
};
var dbPool = new pg.Pool(connectionConfiguration);
exports["default"] = dbPool;
