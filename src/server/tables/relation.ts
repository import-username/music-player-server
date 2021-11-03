import { QueryCallback } from "../../ts/types/relation";
import generateRelation from "../util/generateRelation";
import dbPool from "../util/databasePool";
import { IRelation } from "../../ts/interfaces/relation";

function Relation(relationAlias: string, relationColumns: object) {
    this.relationAlias = relationAlias;
    this.relationColumns = relationColumns;
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
 * @param {saveQueryCallback} callback
 * @memberof Relation
 */
Relation.prototype.save = function(columns: object, queryOptions?: any | QueryCallback, callback?: QueryCallback): void {
    if (arguments.length === 2) {
        callback = <QueryCallback> queryOptions;
        queryOptions = {};
    } else if (arguments.length === 3) {
        queryOptions = {};
    } else {
        return callback(new Error("Invalid or insufficient parameters."), null);
    }

    if (Object.keys(columns).length === Object.keys(this.relationColumns).length) {
        const queryText: string = `INSERT INTO songs (${getColumnsString(columns)}) VALUES(${getPreparedValuesString(columns)});`;

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
