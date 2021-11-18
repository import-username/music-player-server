import * as express from "express";
import auth from "../middleware/auth";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";
import uploadFile from "../middleware/uploadFile";
import Songs from "../tables/songs";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import createGetSongsQueryOptions from "../middleware/createGetSongsQueryOptions";
import { IRelationRequest } from "../../ts/interfaces/relation";
import { ISongData, IUploadSongRequest } from "../../ts/interfaces/songs";

const router: express.Router = express.Router();

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

// Make uploads directory if it doesn't exist.
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

/**
 * Deletes file directories.
 * @param paths Paths of file directories to remove
 */
function removeFileDirectories(...paths: string[]) {
    paths.forEach((fileDir: string) => {
        fs.rmSync(fileDir, { recursive: true, force: true });
    });
}

export default function songRoute(): express.Router {
    router.post("/upload-song", auth, uploadFile, (req: IUploadSongRequest, res: express.Response): void | express.Response => {
        if (req.songData.song_title) {
            const saveQueryData: ISongData = {
                id: "DEFAULT",
                user_id: req.user.id,
                song_file_path: req.songData.song_file_path,
                song_title: req.songData.song_title,
                song_thumbnail_path: req.songData.song_thumbnail_path || "NULL",
                song_description: req.songData.song_description || "NULL",
                song_author: req.songData.song_author || "NULL",
                song_playlists: "DEFAULT",
                song_favorite: "FALSE"
            }

            Songs.save(saveQueryData, (err: Error, result: string) => {
                if (err) {
                    removeFileDirectories(
                        path.join(uploadPath, req.songData.song_file_path),
                        path.join(uploadPath, req.songData.song_thumbnail_path)
                    );

                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                return res.status(200).json({
                    message: "Song successfully created."
                });
            });
        } else {
            removeFileDirectories(
                path.join(uploadPath, req.songData.song_file_path),
                path.join(uploadPath, req.songData.song_thumbnail_path)
            );

            return res.status(401).json({
                message: "Failed to provide song title (Required field)."
            });
        }
    });

    router.get("/get-songs", auth, createGetSongsQueryOptions, (req: IRelationRequest, res: express.Response): void | express.Response => {
        Songs.find({ user_id: req.user.id }, req.queryOptions, (err: Error, result: any) => {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            let response: any = {
                tables: result.rows.map((row) => {
                    let rowObj = {};
        
                    for (let i in row) {
                        if (i !== "id" && i !== "user_id") {
                            rowObj[i] = row[i];
                        }
                    }
        
                    return rowObj;
                })
            }
            
            if (result.total) {
                response.total = result.total;
            }

            return res.status(200).json(response);
        });
    });

    return router;
}
