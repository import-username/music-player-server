"use strict";
exports.__esModule = true;
var databasePool_1 = require("../util/databasePool");
/**
 * Checks if table with provided name exists, and creates it if not.
 * @param relationAlias Name of table to verify/create.
 * @param columns Name of columns/column data types to create table with.
 */
function generateRelation(relationAlias, columns) {
    if (columns === void 0) { columns = {}; }
    if ((typeof relationAlias === "string") && isValidColumnObject(columns)) {
        var existsQuery = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=$1);";
        var existsValues = [relationAlias];
        // Query database to see if table/relation exists.
        databasePool_1["default"].query(existsQuery, existsValues, function (err, result) {
            if (err) {
                throw err;
            }
            var tableExists = result.rows[0].exists;
            // If tableExists is falsy, query database again to create table/relation with provided relationAlias as name.
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
/**
 * Takes an object of column names/data types and returns
 * a string with each set of columns separated by a comma.
 * @param columns Object with column names/data types to insert into relational database.
 * @returns String of separated columns.
 */
function getColumns(columns) {
    var columnString = "";
    for (var i in columns) {
        columnString += i + " " + columns[i] + ", ";
    }
    return columnString.substr(0, columnString.length - 2);
}
/**
 * Checks if columns object is valid.
 * @param columns Object of column names/data types.
 * @returns True or false.
 */
function isValidColumnObject(columns) {
    return (typeof columns === "object") && (Object.keys(columns).length > 0);
}
