import { Router } from "express";
import * as path from "path";
import * as fs from "fs";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import auth from "../middleware/auth";
import uploadPlaylist from "../middleware/uploadPlaylist";
import Playlist from "../tables/playlist";
import Song from "../tables/song";
import { Op, Order } from "sequelize";

const router: Router = Router();

const uploadPath: string = process.env.UPLOAD_DIR;

function removeFileDirectories(...paths: string[]) {
    paths.forEach((fileDir: string) => {
        fs.rmSync(fileDir, { recursive: true, force: true });
    });
}

export default function playlistRoute(): Router {
    router.get("/get-songs/:playlistId", auth, async (req: IAuthRequest, res) => {
        if (!req.params.playlistId) {
            return res.status(401).json({
                message: "Must include playlist id in url query param."
            });
        }

        try {
            const playlistQuery = await Playlist.findOne({
                where: {
                    user_id: req.user.id + "",
                    id: req.params.playlistId
                }
            });

            if (!playlistQuery) {
                return res.status(401).json({
                    message: "Client does not have access to that playlist."
                });
            }

            let skip: number = 0;

            if (req.query.skip && !isNaN(parseInt(<string> req.query.skip))) {
                skip = parseInt(<string> req.query.skip);
            }

            const songQuery = await Song.findAll({
                where: {
                    user_id: req.user.id + "",
                    song_playlists: {
                        [Op.contains]: [req.params.playlistId + ""]
                    },
                },
                limit: 500,
                offset: skip,
                order: [["updated_at", "DESC"], ["id", "ASC"]]
            });

            if (!songQuery || songQuery.length < 1) {
                return res.status(401).json({
                    message: "Failed to find songs belonging to playlist."
                });
            }

            const songs = songQuery.map((song) => {
                const songObj = {};

                for (let i in song.get()) {
                    if (!/user_id|song_file_path|song_playlists/.test(i)) {
                        songObj[i] = song.get()[i];
                    }
                }

                return songObj;
            });

            return res.status(200).json({
                rows: songs,
                total: songs.length
            });
        } catch (exc) {
            return res.status(500).json({
                message: "Internal server error."
            });
        }
    });

    router.post("/create-playlist", auth, uploadPlaylist, (req: any, res) => {
        Playlist.create({ playlist_title: req.playlistTitle, playlist_thumbnail_path: req.playlist_thumbnail_path || null, user_id: req.user.id })
            .then((query) => {
                return res.sendStatus(200);
            }).catch((err) => {
                return res.status(500).json({
                    message: "Internal server error."
                });
            });
    });

    router.get("/get-playlists", auth, (req: IAuthRequest, res) => {
        const filter: { offset: number, limit: number, where: object, order: Order } = {
            offset: parseInt((req.query.skip || req.query.offset) + "") || 0,
            limit: parseInt(req.query.limit + "") || 100,
            where: {
                user_id: req.user.id + ""
            },
            order: [["updatedAt", "DESC"], ["id", "ASC"]]
        };

        if (req.query.titleIncludes) {
            filter.where["playlist_title"] = {
                [Op.iLike]: `%${req.query.titleIncludes}%`
            }
        }

        const offset: number = parseInt((req.query.skip || req.query.offset) + "") || 0;

        const limit: number = parseInt(req.query.limit + "") || 100;

        // TODO - add logic for search queries
        Playlist.findAndCountAll(filter).then((playlistQuery) => {
            const playlists: Array<object> = playlistQuery.rows.map((playlist) => {
                let playlistObj = {};

                for (let i in playlist.get()) {
                    if (!/user_id|createdAt|updatedAt/.test(i)) {
                        playlistObj[i] = playlist.get()[i];
                    }
                }

                return playlistObj;
            });

            return res.status(200).json({
                rows: playlists,
                total: playlistQuery.count
            });
        }).catch((err) => {
            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });

    router.get("/get-thumbnail/:id", auth, (req: IAuthRequest, res) => {
        if (req.params.id) {
            Playlist.findOne({
                where: {
                    user_id: req.user.id + "",
                    playlist_thumbnail_path: `/${req.params.id.split(".")[0]}/${req.params.id}`
                }
            }).then((playlist) => {
                if (!playlist) {
                    return res.status(401).json({
                        message: "Failed to find thumbnail with that id."
                    });
                }

                const playlistItem = playlist.get();

                const filePath: string = path.join(uploadPath, playlistItem.playlist_thumbnail_path);

                return res.sendFile(filePath);
            }).catch((err) => {
                return res.status(500).json({
                    message: "Internal server error."
                });
            });
        } else {
            return res.status(401).json({
                message: "Failed to find thumbnail with that id."
            });
        }
    });

    router.delete("/delete-playlist/:id", auth, (req: IAuthRequest, res) => {
        Playlist.findOne({
            where: {
                id: req.params.id + "",
                user_id: req.user.id + ""
            }
        }).then((playlistQuery) => {
            if (!playlistQuery) {
                return res.status(401).json({
                    message: "Client does not have access to that playlist."
                });
            }

            Playlist.destroy({
                where: {
                    id: req.params.id + "",
                    user_id: req.user.id + ""
                }
            }).then(() => {
                if (playlistQuery.get().playlist_thumbnail_path) {
                    removeFileDirectories(path.join(uploadPath, playlistQuery.get().playlist_thumbnail_path.split("/")[1]));
                }

                return res.status(200).json({
                    message: "Playlist successfully deleted."
                });
            }).catch((err) => {
                return res.status(500).json({
                    message: "Internal server error."
                });
            });
        }).catch((err) => {
            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });

    return router;
}
