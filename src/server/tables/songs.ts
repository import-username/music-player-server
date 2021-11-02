import { QueryResult } from "pg";
import { ISaveQuery, ISaveQueryOptionals } from "../../ts/interfaces/songs";
import { SaveQueryCallback } from "../../ts/types/songs";
import { UsersInsertCallback, UsersQueryCallback } from "../../ts/types/users";
import dbPool from "../util/databasePool";
import generateRelation from "../util/generateRelation";

generateRelation("songs", {
    id: "SERIAL PRIMARY KEY",
    user_id: "VARCHAR(255)",
    song_file_path: "VARCHAR(255)",
    song_thumbnail_path: "VARCHAR(255) DEFAULT NULL",
    song_title: "VARCHAR(255)",
    song_description: "text DEFAULT NULL",
    song_author: "VARCHAR(255) DEFAULT NULL",
    song_favorite: "boolean DEFAULT FALSE",
    song_playlists: "varchar(255)[] DEFAULT array[]::varchar(255)[]"
});

export function findById() {

}

/**
 * @callback saveQueryCallback
 * @param {Error} err - Error object.
 * @param {string} queryResult The query result string.
 */

/**
 * Saves a song row to songs table.
 * @param {string} userId Id of user that should own this row.
 * @param {string} filePath Path to the mp3/mp4/etc song file, including the enclosing file directory.
 * @param {string} title Title of song
 * @param {object} optionals Object of optional columns to insert into this row.
 * @param {saveQueryCallback} callback e
 */
export function save(userId: string, filePath: string, title: string, 
    optionals?: ISaveQueryOptionals | SaveQueryCallback, callback?: SaveQueryCallback): void {
    if (arguments.length === 4) {
        callback = <SaveQueryCallback> optionals;
        optionals = <ISaveQueryOptionals> {
            thumbnailPath: "NULL",
            description: "NULL",
            author: "NULL",
            favorite: false,
            playlists: []
        };
    } else if (arguments.length === 5) {
        optionals = <ISaveQueryOptionals> Object.assign({
            thumbnailPath: "NULL",
            description: "NULL",
            author: "NULL",
            favorite: false,
            playlists: []
        }, optionals);
    } else {
        throw new Error("Invalid or insufficient parameters.");
    }

    const queryText: string = "INSERT INTO songs VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7);";
    const queryValues: Array<any> = [
        userId,
        filePath,
        optionals.thumbnailPath,
        title,
        optionals.description,
        optionals.author,
        `${optionals.favorite}`.toUpperCase()
    ];

    dbPool.query(queryText, queryValues, (err: Error, queryResult: QueryResult) => {
        if (err) {
            return callback(err, null);
        }

        return callback(null, "Success");
    });
}
