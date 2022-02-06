import { Router } from "express";
import * as path from "path";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import auth from "../middleware/auth";
import uploadPlaylist from "../middleware/uploadPlaylist";
import Playlist from "../tables/playlist";

const router: Router = Router();

export default function playlistRoute(): Router {
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
        const offset: number = parseInt((req.query.skip || req.query.offset) + "") || 0;

        const limit: number = parseInt(req.query.limit + "") || 100;

        // TODO - add logic for search queries
        Playlist.findAndCountAll({
            where: {
                user_id: req.user.id + ""
            },
            limit: limit,
            offset: offset
        }).then((playlistQuery) => {
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

                const filePath: string = process.env.UPLOAD_DIR
                    ? path.join(process.env.UPLOAD_DIR, playlistItem.playlist_thumbnail_path)
                    : path.join(__dirname, "..", "..", "uploads", playlistItem.playlist_thumbnail_path);

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

    return router;
}
