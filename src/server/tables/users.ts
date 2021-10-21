import dbPool from "../util/databasePool";

export function findById(email: string, password: string, callback) {
    const queryText: string = "SELECT * FROM users WHERE email=$1;";

    dbPool.query(queryText, [email], callback);
}