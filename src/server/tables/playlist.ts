import sequelize from "./connection";
import { DataTypes } from "sequelize";

const Playlist = sequelize.define("Playlist", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
    },
    user_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    playlist_thumbnail_path: {
        type: DataTypes.STRING,
        allowNull: true
    },
    playlist_title: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, { tableName: "playlists", timestamps: true });

Playlist.sync({ alter: true });

export default Playlist;
