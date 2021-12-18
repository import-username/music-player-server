import * as express from "express";
import auth from "../middleware/auth";
import * as path from "path";
import * as fs from "fs";
import uploadFile from "../middleware/uploadFile";
import Song from "../tables/song";
import Songs from "../tables/songs";
import createGetSongsQueryOptions from "../middleware/createGetSongsQueryOptions";
import { IRelationRequest } from "../../ts/interfaces/relation";
import { ISongData, IUploadSongRequest } from "../../ts/interfaces/songs";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";

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
                user_id: req.user.id,
                song_file_path: req.songData.song_file_path,
                song_title: req.songData.song_title,
                song_thumbnail_path: req.songData.song_thumbnail_path || "NULL",
                song_description: req.songData.song_description || "NULL",
                song_author: req.songData.song_author || "NULL",
                song_playlists: [],
                song_favorite: "FALSE"
            }

            // TODO - add song duration to query
            Song.create(saveQueryData).then((saveQuery) => {
                return res.status(200).json({
                    message: "Song successfully created."
                });
            }).catch((err: Error) => {
                console.error("Internal server error: ", err.message);

                if (req.songData.song_file_path) {
                    removeFileDirectories(path.join(uploadPath, req.songData.song_file_path));
                }
                
                if (req.songData.song_thumbnail_path) {
                    removeFileDirectories(path.join(uploadPath, req.songData.song_thumbnail_path));
                }

                return res.status(500).json({
                    message: "Internal server error."
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
                rows: result.rows.map((row) => {
                    let rowObj = {};
        
                    for (let i in row) {
                        if (i !== "user_id") {
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

    router.get("/get-song/:id", auth, (req: IAuthRequest, res: express.Response) => {
        Songs.findOne({ user_id: req.user.id, id: req.params.id }, (err: Error, result: any) => {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (!result) {
                return res.status(401).json({
                    message: "Client does not have access to that item."
                });
            }

            let row = {}

            for (let i in result) {
                if (i !== "user_id") {
                    row[i] = result[i];
                }
            }

            return res.status(200).json({
                row
            });
        });
    });

    router.get("/get-thumbnail/:id", auth, (req: IUploadSongRequest, res: express.Response) => {
        if (req.params.id) {
            Songs.findOne({
                user_id: req.user.id,
                song_thumbnail_path: `/${req.params.id.split(".")[0]}/${req.params.id}`
            }, (err: Error, result: ISongData) => {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                if (!result) {
                    return res.status(401).json({
                        message: "Failed to find thumbnail with that id."
                    });
                }

                const filePath: string = path.join(__dirname, "..", "..", "uploads", result.song_thumbnail_path);

                return res.sendFile(filePath);
            });
        } else {
            return res.status(401).json({
                message: "Failed to find thumbnail with that id."
            });
        }
    });

    router.get("/:id", auth, (req: IAuthRequest, res: express.Response) => {
        // Audio files must be encoded with CBR, otherwise android client might not accept.
        let range = req.headers.range;

        if (isNaN(parseInt(req.params.id))) {
            return res.status(401).json({
                message: "Invalid url parameter for id."
            });
        }
        
        Songs.findOne({ user_id: req.user.id, id: req.params.id }, (err: Error, result: ISongData) => {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (!result) {
                return res.status(401).json({
                    message: "Client is not authorized to access that file."
                });
            }

            const songPath = path.join(uploadPath, result.song_file_path);
            
            const videoSize = fs.statSync(songPath).size;

            // TODO - send correct content-type header in response
            if (range && !isNaN(parseInt(range.replace(/\D/g, "")))) {
                const startByte = Number(range.replace(/\D/g, ""));
        
                const endByte = (startByte + (10 ** 6)) > videoSize ? videoSize - 1 : (startByte + (10 ** 6));
        
                const contentLength = endByte - startByte + 1;
                const headers = {
                    "Content-Range": `bytes ${startByte}-${endByte}/${videoSize}`,
                    "Accept-Ranges": "bytes",
                    "Content-Length": contentLength,
                    "Content-Type": "audio/mp3"
                }
        
                res.writeHead(206, headers);
        
                const videoStream = fs.createReadStream(songPath, { start: startByte, end: endByte });
        
                return videoStream.pipe(res);
            }
    
            res.writeHead(200, {
                "Content-Length": videoSize
            });
        
            const videoStream = fs.createReadStream(songPath);
    
            return videoStream.pipe(res);
        });
    });

    return router;
}
