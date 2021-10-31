import { QueryResult } from "pg";
import dbPool from "../util/databasePool";

/**
 * Checks if table with provided name exists, and creates it if not.
 * @param relationAlias Name of table to verify/create.
 * @param columns Name of columns/column data types to create table with.
 */
export default function generateRelation(relationAlias: string, columns = {}) {
    if ((typeof relationAlias === "string") && isValidColumnObject(columns)) {
        const existsQuery: string = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name=$1)";

        const existsValues: string[] = [relationAlias];

        // Query database to see if table/relation exists.
        dbPool.query(existsQuery, existsValues, (err: Error, result: QueryResult) => {
            if (err) {
                throw err;
            }
            
            const tableExists: boolean = result.rows[0]["exists"];

            // If tableExists is falsy, query database again to create table/relation with provided relationAlias as name.
            if (!tableExists) {
                const createQuery: string = `CREATE TABLE ${relationAlias}(${getColumns(columns)});`;

                dbPool.query(createQuery, (err: Error, createResult: QueryResult) => {
                    if (err) {
                        throw err;
                    }

                    console.log(`${relationAlias} Relation was created.`);
                });
            }
        });
    }
}

/**
 * Takes an object of column names/data types and returns
 * a string with each set of columns separated by a comma.
 * @param columns Object with column names/data types to insert into relational database.
 * @returns String of separated columns.
 */
function getColumns(columns: object): string {
    let columnString: string = "";

    for (let i in columns) {
        columnString += `${i} ${columns[i]}, `;
    }

    return columnString.substr(0, columnString.length - 2);
}

/**
 * Checks if columns object is valid.
 * @param columns Object of column names/data types.
 * @returns True or false.
 */
function isValidColumnObject(columns: object): boolean {
    return (typeof columns === "object") && (Object.keys(columns).length > 0);
}
