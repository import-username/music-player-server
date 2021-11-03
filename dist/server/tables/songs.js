"use strict";
exports.__esModule = true;
var relation_1 = require("./relation");
var Songs = (0, relation_1.createRelation)("songs", {
    id: "SERIAL PRIMARY KEY",
    user_id: "VARCHAR(255)",
    song_file_path: "VARCHAR(255)",
    song_thumbnail_path: "VARCHAR(255) DEFAULT NULL",
    song_title: "VARCHAR(255)",
    song_description: "text DEFAULT NULL",
    song_author: "VARCHAR(255) DEFAULT NULL",
    song_favorite: "boolean DEFAULT FALSE",
    song_playlists: "varchar(255)[] DEFAULT array[]::varchar(255)[]"
}, true);
exports["default"] = Songs;
