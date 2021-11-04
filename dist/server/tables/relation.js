"use strict";
exports.__esModule = true;
exports.createRelation = void 0;
var generateRelation_1 = require("../util/generateRelation");
var databasePool_1 = require("../util/databasePool");
function Relation(relationAlias, relationColumns) {
    this.relationAlias = relationAlias;
    this.relationColumns = relationColumns;
}
Relation.prototype.save = function (columns, queryOptions, callback) {
    if (arguments.length === 2) {
        callback = queryOptions;
        queryOptions = {};
    }
    else if (arguments.length === 3) {
    }
    else {
        return callback(new Error("Invalid or insufficient parameters."), null);
    }
    if (Object.keys(columns).length === Object.keys(this.relationColumns).length) {
        var queryText = "INSERT INTO " + this.relationAlias + " (" + getColumnsString(columns) + ") VALUES(" + getPreparedValuesString(columns) + ");";
        var queryValues = Object.values(columns).filter(function (column) {
            return column != "DEFAULT";
        });
        databasePool_1["default"].query(queryText, queryValues, function (err, queryResult) {
            if (err) {
                return callback(err, null);
            }
            return callback(null, "Success");
        });
    }
    else {
        return callback(new Error("Insufficient columns. " + Object.keys(this.relationColumns).length + " required, " + Object.keys(columns).length + " provided."), null);
    }
};
Relation.prototype.find = function (queryFilter, queryOptions, callback) {
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
    for (var i in queryFilter) {
        if (!Object.keys(this.relationColumns).includes(i)) {
            return callback(new Error("Filter property " + i + " does not match valid relation columns."), null);
        }
    }
    var whereClause = "";
    var whereIndex = 1;
    for (var i in queryFilter) {
        whereClause += i + "=$" + whereIndex + " AND ";
        whereIndex++;
    }
    whereClause = whereClause.substring(0, whereClause.length - 5);
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
};
Relation.prototype.autoGenerateRelation = generateRelation_1["default"];
function getPreparedValuesString(columnsObject) {
    var preparedValues = "";
    var valueNumber = 1;
    for (var i in columnsObject) {
        if (columnsObject[i] === "DEFAULT") {
            preparedValues += "DEFAULT, ";
        }
        else {
            preparedValues += "$" + valueNumber + ", ";
            valueNumber++;
        }
    }
    return preparedValues.substring(0, preparedValues.length - 2);
}
function getColumnsString(columnsObject) {
    var columnNames = "";
    for (var i in columnsObject) {
        columnNames += i + ", ";
    }
    return columnNames.substr(0, columnNames.length - 2);
}
function createRelation(relationAlias, relationColumns, autoGenerate) {
    var relationObject = new Relation(relationAlias, relationColumns);
    if (autoGenerate) {
        relationObject.autoGenerateRelation(relationAlias, relationColumns);
    }
    return relationObject;
}
exports.createRelation = createRelation;
