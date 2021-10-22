"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.save = exports.findByEmail = exports.findById = void 0;
var databasePool_1 = require("../util/databasePool");
/**
 * Queries postgresql database users table for a single row with id.
 * @param {string} id Id to query for.
 * @param callback
 */
function findById(id, callback) {
    var queryText = "SELECT * FROM users WHERE id=$1;";
    databasePool_1["default"].query(queryText, [id], function (err, queryResult) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, __spreadArray([], queryResult.rows, true)[0]);
    });
}
exports.findById = findById;
/**
 * Queries postgresql database users table for a single row with email.
 * @param {string} email Email to query for.
 * @param callback
 */
function findByEmail(email, callback) {
    var queryText = "SELECT * FROM users WHERE email=$1;";
    databasePool_1["default"].query(queryText, [email], function (err, queryResult) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, __spreadArray([], queryResult.rows, true)[0]);
    });
}
exports.findByEmail = findByEmail;
/**
 * Inserts a new user row into users table.
 * @param email Email value to add to row.
 * @param password Password value to add to row.
 * @param callback
 */
function save(email, password, callback) {
    var queryText = "INSERT INTO users VALUES($1, $2);";
    databasePool_1["default"].query(queryText, [email, password], function (err, queryResult) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, "Success");
    });
}
exports.save = save;
