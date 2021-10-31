"use strict";
exports.__esModule = true;
var databasePool_1 = require("../util/databasePool");
function generateRelation(relationAlias, columns) {
    if (columns === void 0) { columns = {}; }
    if ((typeof relationAlias === "string") && isValidColumnObject(columns)) {
        var existsQuery = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=$1);";
        var existsValues = [relationAlias];
        databasePool_1["default"].query(existsQuery, existsValues, function (err, result) {
            if (err) {
                throw err;
            }
            var tableExists = result.rows[0].exists;
            if (!tableExists) {
                var createQuery = "CREATE TABLE users(" + getColumns(columns) + ");";
                databasePool_1["default"].query(createQuery, function (err, createResult) {
                    if (err) {
                        throw err;
                    }
                    console.log(relationAlias + " Relation was created.");
                });
            }
        });
    }
}
exports["default"] = generateRelation;
function getColumns(columns) {
    var columnString = "";
    for (var i in columns) {
        columnString += i + " " + columns[i] + ", ";
    }
    return columnString.substr(0, columnString.length - 2);
}
function isValidColumnObject(columns) {
    return (typeof columns === "object") && (Object.keys(columns).length > 0);
}
