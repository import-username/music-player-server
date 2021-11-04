import { QueryCallback } from "../../ts/types/relation";
import generateRelation from "../util/generateRelation";
import dbPool from "../util/databasePool";
import { IFindQueryOptions, IRelation } from "../../ts/interfaces/relation";
import findQuery from "./query/findQuery";

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

Relation.prototype.find = findQuery;

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
