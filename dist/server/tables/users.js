"use strict";
exports.__esModule = true;
exports.findById = void 0;
var databasePool_1 = require("../util/databasePool");
function findById(email, password, callback) {
    var queryText = "SELECT * FROM users WHERE email=$1;";
    databasePool_1["default"].query(queryText, [email], callback);
}
exports.findById = findById;
