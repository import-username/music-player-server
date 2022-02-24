import sequelize from "./connection";
import { DataTypes, Sequelize } from "sequelize";

const Song = sequelize.define("Song", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    user_id: {
        type: DataTypes.STRING
    },
    song_file_path: {
        type: DataTypes.STRING
    },
    song_thumbnail_path: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
    },
    song_title: {
        type: DataTypes.STRING
    },
    song_description: {
        type: DataTypes.TEXT,
        defaultValue: null,
        allowNull: true
    },
    song_author: {
        type: DataTypes.STRING,
        defaultValue: null,
        allowNull: true
    },
    song_favorite: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    song_playlists: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: []
    },
}, {
    tableName: "songs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});

Song.sync();

export default Song;
