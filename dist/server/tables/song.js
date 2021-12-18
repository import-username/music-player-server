"use strict";
exports.__esModule = true;
var connection_1 = require("./connection");
var sequelize_1 = require("sequelize");
var Song = connection_1["default"].define("Song", {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: sequelize_1.DataTypes.STRING
    },
    song_file_path: {
        type: sequelize_1.DataTypes.STRING
    },
    song_thumbnail_path: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: "NULL",
        allowNull: true
    },
    song_title: {
        type: sequelize_1.DataTypes.STRING
    },
    song_description: {
        type: sequelize_1.DataTypes.TEXT,
        defaultValue: "NULL",
        allowNull: true
    },
    song_author: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: "NULL",
        allowNull: true
    },
    song_favorite: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: "FALSE"
    },
    song_playlists: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: []
    }
}, {
    tableName: "songs",
    timestamps: false
});
Song.sync();
exports["default"] = Song;
