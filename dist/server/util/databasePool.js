"use strict";
exports.__esModule = true;
var pg = require("pg");
var dotenv = require("dotenv");
dotenv.config();
/**
 * Initializes pool object with configuration properties so connection
 * pool may be accessed throughout other modules.
 */
var connectionConfiguration = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_ALIAS,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT)
};
var dbPool = new pg.Pool(connectionConfiguration);
exports["default"] = dbPool;
