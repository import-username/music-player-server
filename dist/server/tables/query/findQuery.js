"use strict";
exports.__esModule = true;
var databasePool_1 = require("../../util/databasePool");
function findQuery(queryFilter, queryOptions, callback) {
    if (arguments.length > 3 || arguments.length < 2) {
        return callback(new Error("Insufficient arguments. Expected 2-3 got " + arguments.length + "."), null);
    }
    if (arguments.length === 2) {
        callback = queryOptions;
        queryOptions = {};
    }
    else {
        queryOptions = queryOptions;
    }
    if (!isValidQueryFilter.call(this, queryFilter)) {
        return callback(new Error("One or more filter properties does not match valid relation columns."), null);
    }
    var _a = getWhereClause.call(this, queryFilter, true), whereClause = _a[0], whereIndex = _a[1];
    var queryText = "SELECT * FROM " + this.relationAlias + " WHERE (" + whereClause + ")";
    queryText += " OFFSET $" + whereIndex;
    queryText += queryOptions.limit ? " LIMIT $" + ++whereIndex : "";
    queryText += ";";
    var queryValues = Object.values(queryFilter);
    queryValues.push(queryOptions.skip || queryOptions.offset || 0);
    if (queryOptions.limit) {
        queryValues.push(queryOptions.limit);
    }
    databasePool_1["default"].query(queryText, queryValues, function (err, result) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, result);
    });
}
exports["default"] = findQuery;
function isValidQueryFilter(queryFilter) {
    for (var i in queryFilter) {
        if (!Object.keys(this.relationColumns).includes(i)) {
            return false;
        }
    }
    return true;
}
function getWhereClause(queryFilter, returnWhereIndex) {
    var whereClause = "";
    var whereIndex = 1;
    for (var i in queryFilter) {
        whereClause += i + "=$" + whereIndex + " AND ";
        whereIndex++;
    }
    whereClause = whereClause.substring(0, whereClause.length - 5);
    if (returnWhereIndex) {
        return [whereClause, whereIndex];
    }
    return whereClause;
}
