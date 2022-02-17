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
import { Op } from "sequelize";
import Playlist from "../tables/playlist";
import sequelize from "../tables/connection";

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
                return res.status(200).json(Object.keys(saveQuery.get()).filter((key) => {
                    return key !== "user_id"
                }).reduce((prev: object, current: string) => {
                    return {
                        ...prev,
                        [current]: saveQuery[current]
                    }
                }, {}));
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
        let filter = {
            offset: req.queryOptions.offset, 
            limit: req.queryOptions.limit,
            where: { user_id: req.user.id + "" }
        }

        if (req.query.titleIncludes) {
            filter.where["song_title"] = {
                [Op.iLike]: `%${req.query.titleIncludes}%`
            }
        }

        Song.findAll(filter).then((query) => {
            let response: { rows: object[], total?: number | string } = {
                rows: query.map((item) => {
                    let itemData = item.get();
                    let rowObj = {};

                    for (let i in itemData) {
                        if (i !== "user_id") {
                            rowObj[i] = itemData[i];
                        }
                    }
        
                    return rowObj;
                })
            }

            if (req.queryOptions.includeTotal) {
                Song.count({
                    where: { user_id: req.user.id + "" }
                }).then((countQuery) => {
                    response.total = countQuery;

                    return res.status(200).json(response);
                }).catch((err: Error) => {
                    console.error("Internal server error: ", err.message);

                    return res.status(500).json({
                        message: "Internal server error."
                    });
                });
            } else {
                return res.status(200).json(response);
            }
        }).catch((err) => {
            console.error("Internal server error: ", err.message);

            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });

    router.get("/get-song/:id", auth, (req: IAuthRequest, res: express.Response) => {
        Song.findOne({
            where: {
                user_id: req.user.id + "",
                id: req.params.id + ""
            }
        }).then((songQuery) => {
            console.log(songQuery)

            return res.sendStatus(200);
        }).catch((err: Error) => {
            console.error("Internal server error: ", err.message);

            return res.status(500).json({
                message: "Internal server error."
            });
        })
        // Songs.findOne({ user_id: req.user.id, id: req.params.id }, (err: Error, result: any) => {
        //     if (err) {
        //         return res.status(500).json({
        //             message: "Internal server error."
        //         });
        //     }

        //     if (!result) {
        //         return res.status(401).json({
        //             message: "Client does not have access to that item."
        //         });
        //     }

        //     let row = {}

        //     for (let i in result) {
        //         if (i !== "user_id") {
        //             row[i] = result[i];
        //         }
        //     }

        //     return res.status(200).json({
        //         row
        //     });
        // });
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

            if (range && !isNaN(parseInt(range.replace(/\D/g, "")))) {
                try {
                    let startByte = Number(range.replace(/\D/g, ""));
            
                    const endByte = Math.min(startByte + (10 ** 6), videoSize - 1);
    
                    const videoStream = fs.createReadStream(songPath, { start: startByte, end: endByte });

                    const headers = {
                        "Content-Range": `bytes ${startByte}-${endByte}/${videoSize}`,
                        "Accept-Ranges": "bytes",
                        "Content-Length":  videoSize,
                        "Content-Type": "audio/ogg"
                    }
                    
                    res.writeHead(206, headers);
            
                    return videoStream.pipe(res);
                } catch (exc) {}
            }
            
            res.writeHead(200, {
                "Content-Length": videoSize
            });
        
            const videoStream = fs.createReadStream(songPath);
    
            return videoStream.pipe(res);
        });
    });

    router.patch("/add-to-playlist/:songId/:playlistId", auth, async (req: IAuthRequest, res) => {
        const { songId, playlistId }: {songId?: string | undefined, playlistId?: string | undefined} = req.params;

        if (!songId || !playlistId) {
            return res.status(401).json({
                message: "Client does not have access to that playlist or song."
            });
        }

        try {
            const playlistQuery = await Playlist.findOne({
                where: {
                    user_id: req.user.id + "",
                    id: playlistId
                }
            });
    
            if (!playlistQuery) {
                return res.status(401).json({
                    message: "Client does not have access to that playlist."
                });
            }
    
            const songQuery = await Song.findOne({
                where: {
                    user_id: req.user.id + "",
                    id: songId
                }
            });

            if (!songQuery || songQuery.get()["song_playlists"].includes(playlistId)) {
                return res.status(401).json({
                    message: "Client does not have access to that song."
                });
            }

            const songUpdateQuery = await Song.update(
                { song_playlists: sequelize.fn("array_append", sequelize.col("song_playlists"), playlistId) },
                { where: {
                    id: songId,
                    user_id: req.user.id + ""
                }}
            );

            if (songUpdateQuery[0] === 0) {
                return res.status(401).json({
                    message: "Could not find that item."
                });
            }

            return res.sendStatus(200);
        } catch (exc) {
            return res.status(500).json({
                message: "Internal server error."
            });
        }
    });

    router.delete("/delete/:id", auth, (req: IAuthRequest, res) => {
        Song.findOne({
            where: {
                id: req.params.id + "",
                user_id: req.user.id + ""
            }
        }).then((songQuery) => {
            if (!songQuery) {
                return res.status(401).json({
                    message: "Client does not have access to that song."
                });
            }

            Song.destroy({
                where: {
                    id: req.params.id + "",
                    user_id: req.user.id + ""
                }
            }).then(() => {
                if (songQuery.get().song_thumbnail_path) {
                    removeFileDirectories(path.join(uploadPath, songQuery.get().song_thumbnail_path.split("/")[1]));
                }
                
                if (songQuery.get().song_file_path) {
                    removeFileDirectories(path.join(uploadPath, songQuery.get().song_file_path.split("/")[1]));
                }

                return res.status(200).json({
                    message: "Song successfully deleted."
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
