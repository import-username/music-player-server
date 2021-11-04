import { QueryCallback } from "../../ts/types/relation";
import generateRelation from "../util/generateRelation";
import dbPool from "../util/databasePool";
import { IFindQueryOptions, IRelation } from "../../ts/interfaces/relation";

function Relation(relationAlias: string, relationColumns: object) {
    this.relationAlias = relationAlias;
    this.relationColumns = relationColumns;
}

/**
 * Saves a song row to songs table.
 * @param {object} columns Object of columns to save to row.
 * @param {object} queryOptions Object of query options.
 * @param {*} callback
 * @memberof Relation
 */
Relation.prototype.save = function(columns: object, queryOptions?: any | QueryCallback, callback?: QueryCallback): void {
    if (arguments.length === 2) {
        callback = <QueryCallback> queryOptions;
        queryOptions = {};
    } else if (arguments.length === 3) {
    } else {
        return callback(new Error("Invalid or insufficient parameters."), null);
    }

    if (Object.keys(columns).length === Object.keys(this.relationColumns).length) {
        const queryText: string = `INSERT INTO ${this.relationAlias} (${getColumnsString(columns)}) VALUES(${getPreparedValuesString(columns)});`;

        const queryValues: Array<any> = Object.values(columns).filter((column) => {
            return column != "DEFAULT";
        });

        dbPool.query(queryText, queryValues, (err: Error, queryResult: object) => {
            if (err) {
                return callback(err, null);
            }

            return callback(null, "Success");
        });
    } else {
        return callback(new Error(`Insufficient columns. ${Object.keys(this.relationColumns).length} required, ${Object.keys(columns).length} provided.`), null);
    }
}

Relation.prototype.find = function(queryFilter: object, queryOptions?: IFindQueryOptions | QueryCallback, callback?: QueryCallback) {
    // Return an error if too few or too many arguments are provided.
    if (arguments.length > 3 || arguments.length < 2) {
        return callback(new Error(`Insufficient arguments. Expected 2-3 got ${arguments.length}.`), null);
    }

    // If arg len is 2, callback will be second parameter.
    if (arguments.length === 2) {
        callback = <QueryCallback> queryOptions;
        queryOptions = <IFindQueryOptions> {};
    } else {
        // Cast to IFindQueryOptions to avoid having to cast later when using IFindQueryOptions properties.
        queryOptions = <IFindQueryOptions> queryOptions;
    }

    // Iterate over each property key in queryFilter and make sure it's a valid column in the relation.
    for (let i in queryFilter) {
        if (!Object.keys(this.relationColumns).includes(i)) {
            return callback(new Error(`Filter property ${i} does not match valid relation columns.`), null);
        }
    }

    // Create string for WHERE clause in select query.
    let whereClause: string = "";
    let whereIndex = 1;
    // Add each queryFilter column name and its value separated by an =.
    for (let i in queryFilter) {
        whereClause += `${i}=$${whereIndex} AND `;
        whereIndex++;
    }
    // Get rid of unnecessary leading AND operator.
    whereClause = whereClause.substring(0, whereClause.length - 5);

    let queryText: string = `SELECT * FROM ${this.relationAlias} WHERE (${whereClause})`;
    // Add LIMIT, SKIP if property exists in queryOptions or 0 if not.
    queryText += ` OFFSET $${whereIndex}`;
    queryText += queryOptions.limit ? ` LIMIT $${++whereIndex}` : "";
    queryText += ";";

    // Create array of values to substitute in for prepared statement.
    const queryValues: Array<any> = Object.values(queryFilter);
    queryValues.push(queryOptions.skip || queryOptions.offset || 0);

    if (queryOptions.limit) {
        queryValues.push(queryOptions.limit);
    }

    dbPool.query(queryText, queryValues, (err: Error, result: object) => {
        if (err) {
            return callback(err, null);
        }

        return callback(null, result);
    });
}

Relation.prototype.autoGenerateRelation = generateRelation;

function getPreparedValuesString(columnsObject: object) {
    let preparedValues: string = "";

    let valueNumber = 1;

    for (let i in columnsObject) {
        if (columnsObject[i] === "DEFAULT") {
            preparedValues += "DEFAULT, ";
        } else {
            preparedValues += `$${valueNumber}, `;
            valueNumber++;
        }
    }

    return preparedValues.substring(0, preparedValues.length - 2);
}

function getColumnsString(columnsObject: object): string {
    let columnNames: string = "";

    for (let i in columnsObject) {
        columnNames += i + ", ";
    }

    return columnNames.substr(0, columnNames.length - 2);
}

export function createRelation(relationAlias: string, relationColumns: object, autoGenerate: boolean): IRelation {
    const relationObject = new Relation(relationAlias, relationColumns);

    if (autoGenerate) {
        relationObject.autoGenerateRelation(relationAlias, relationColumns);
    }

    return relationObject;
}
