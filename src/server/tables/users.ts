import { QueryResult } from "pg";
import { UsersQueryCallback } from "../../ts/types/users";
import dbPool from "../util/databasePool";

/**
 * Queries postgresql database users table for a single row with id.
 * @param {string} id Id to query for.
 * @param callback 
 */
export function findById(id: string, callback: UsersQueryCallback): void {
    const queryText: string = "SELECT * FROM users WHERE id=$1;";

    dbPool.query(queryText, [id], (err: Error, queryResult: QueryResult) => {
        if (err) {
            return callback(err, null);
        }

        return callback(null, [...queryResult.rows][0]);
    });
}

/**
 * Queries postgresql database users table for a single row with email.
 * @param {string} email Email to query for.
 * @param callback 
 */
export function findByEmail(email: string, callback: UsersQueryCallback): void {
    const queryText: string = "SELECT * FROM users WHERE email=$1;"

    dbPool.query(queryText, [email], (err: Error, queryResult: QueryResult) => {
        if (err) {
            return callback(err, null);
        }

        return callback(null, [...queryResult.rows][0]);
    });
}