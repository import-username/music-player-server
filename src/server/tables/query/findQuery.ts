import { QueryResult } from "pg";
import { IFindQueryOptions } from "../../../ts/interfaces/relation";
import { QueryCallback } from "../../../ts/types/relation";
import dbPool from "../../util/databasePool";

export default function findQuery(queryFilter: object, queryOptions?: IFindQueryOptions | QueryCallback, callback?: QueryCallback) {
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

    // Check if query filter contains valid properties.
    if (!isValidQueryFilter.call(this, queryFilter)) {
        return callback(new Error(`One or more filter properties does not match valid relation columns.`), null);
    }

    // Create string for WHERE clause in select query.
    let [whereClause, whereIndex]: [string, number] = getWhereClause.call(this, queryFilter, true);

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

    dbPool.query(queryText, queryValues, (err: Error, result: any) => {
        if (err) {
            return callback(err, null);
        }

        if ((<IFindQueryOptions> queryOptions).includeTotal) {
            dbPool.query(`SELECT count(*) FROM ${this.relationAlias} as total_rows WHERE ${getWhereClause.call(this, queryFilter, false)};`, Object.values(queryFilter), (err, totalResult) => {
                if (err) {
                    return callback(err, null);
                }

                return callback(null, {
                    rows: result.rows,
                    total: totalResult.rows[0].count
                });
            });
        } else {
            return callback(null, { rows: result.rows });
        }
    });
}

/**
 * Checks if the query filter includes valid properties/columns corresponding to the relation.
 * @param {object} queryFilter Query filter object.
 */
function isValidQueryFilter(queryFilter: object): boolean {
    // Iterate over each property key in queryFilter and make sure it's a valid column in the relation.
    for (let i in queryFilter) {
        if (!Object.keys(this.relationColumns).includes(i)) {
            return false;
        }
    }

    return true;
}

/**
 * Constructs and returns where clause to be used in query.
 * @param {object} queryFilter Query filter object.
 * @param {boolean} returnWhereIndex - Boolean value for if whereIndex should be returned with clause.
 *                                     whereIndex is to be used for prepared statements.
 * @returns Where clause string or an array with where clause and index.
 */
function getWhereClause(queryFilter: object, returnWhereIndex: boolean): string | [string, number] {
    let whereClause: string = "";

    let whereIndex = 1;
    // Add each queryFilter column name and its value separated by an =.
    for (let i in queryFilter) {
        whereClause += `${i}=$${whereIndex} AND `;
        whereIndex++;
    }

    // Get rid of unnecessary leading AND operator.
    whereClause = whereClause.substring(0, whereClause.length - 5);

    if (returnWhereIndex) {
        return [whereClause, whereIndex];
    }

    return whereClause;
}