"use strict";
exports.__esModule = true;
exports.save = exports.findById = void 0;
var databasePool_1 = require("../util/databasePool");
var generateRelation_1 = require("../util/generateRelation");
(0, generateRelation_1["default"])("songs", {
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
function findById() {
}
exports.findById = findById;
function save(userId, filePath, title, optionals, callback) {
    if (arguments.length === 4) {
        callback = optionals;
        optionals = {
            thumbnailPath: "NULL",
            description: "NULL",
            author: "NULL",
            favorite: false,
            playlists: []
        };
    }
    else if (arguments.length === 5) {
        optionals = Object.assign({
            thumbnailPath: "NULL",
            description: "NULL",
            author: "NULL",
            favorite: false,
            playlists: []
        }, optionals);
    }
    else {
        throw new Error("Invalid or insufficient parameters.");
    }
    var queryText = "INSERT INTO songs VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7);";
    var queryValues = [
        userId,
        filePath,
        optionals.thumbnailPath,
        title,
        optionals.description,
        optionals.author,
        ("" + optionals.favorite).toUpperCase()
    ];
    databasePool_1["default"].query(queryText, queryValues, function (err, queryResult) {
        if (err) {
            return callback(err, null);
        }
        return callback(null, "Success");
    });
}
exports.save = save;
