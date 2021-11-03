import { createRelation } from "./relation";

const Songs = createRelation("songs", {
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

export default Songs;
