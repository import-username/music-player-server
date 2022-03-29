import * as express from "express";
import auth from "../middleware/auth";
import * as path from "path";
import * as fs from "fs";
import uploadFile from "../middleware/uploadFile";
import Song from "../tables/song";
import createGetSongsQueryOptions from "../middleware/createGetSongsQueryOptions";
import { IRelationRequest } from "../../ts/interfaces/relation";
import { ISongData, IUploadSongRequest } from "../../ts/interfaces/songs";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import { Op, Order } from "sequelize";
import Playlist from "../tables/playlist";
import sequelize from "../tables/connection";
import fetch from "node-fetch";
import { create as youtubeDlExec } from "youtube-dl-exec";
import getRandomFileName from "../../helper/randomFileName";
import createFileDirectory from "../../helper/createFileDirectory";

const router: express.Router = express.Router();

const uploadPath: string = process.env.UPLOAD_DIR;

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
                song_thumbnail_path: req.songData.song_thumbnail_path || null,
                song_description: req.songData.song_description || null,
                song_author: req.songData.song_author || null,
                song_playlists: [],
                song_favorite: false
            }

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

    // TODO - add duration check before downloading song
    router.post("/create-from-yt", auth, async (req: IAuthRequest, res) => {
        const { ytVideoId }: { ytVideoId?: string } = req.query;

        if (!ytVideoId) {
            return res.status(401).json({
                message: "Client must provide ytVideoId query param."
            });
        }

        const youtubeDl = youtubeDlExec(process.env.YOUTUBEDL_PATH);
        const songDestinationName: string = getRandomFileName();
        let thumbnailDestinationName: string;

        try {
            const youtubeVideo = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?key=${process.env.GOOGLE_API_KEY}&id=${ytVideoId}&part=snippet`
            );
    
            if (youtubeVideo.status !== 200) {
                return res.status(401).json({
                    message: "Failed to find youtube video with that id."
                });
            }
    
            const videoData = (await youtubeVideo.json()).items[0].snippet;
            const { title, thumbnails, channelTitle } = videoData;

            createFileDirectory(songDestinationName);

            if (thumbnails && Object.keys(thumbnails).length > 0) {
                // TODO - thumbnails object does not always have the standard property
                const thumbnailRequest = await fetch(
                    thumbnails.standard.url
                );
                    
                if (thumbnailRequest.status === 200) {
                    thumbnailDestinationName = getRandomFileName();
    
                    createFileDirectory(thumbnailDestinationName);

                    const thumbnailBytes = await thumbnailRequest.arrayBuffer();

                    const thumbnailPath: string = path.join(uploadPath, thumbnailDestinationName, thumbnailDestinationName + ".jpg");

                    fs.writeFileSync(thumbnailPath, Buffer.from(thumbnailBytes));
                }
            }
    
            await youtubeDl(`https://www.youtube.com/watch?v=${ytVideoId}`, {
                extractAudio: true,
                yesPlaylist: true,
                audioFormat: "vorbis",
                retries: 0,
                ignoreErrors: true,
                maxDownloads: 1,
                maxFilesize: "25m",
                output: path.join(uploadPath, songDestinationName, `${songDestinationName}.ogg`),
                cookies: process.env.COOKIES_FILE,
                forceIpv4: true,
                verbose: true
            });

            const createSongQuery = await Song.create({
                user_id: req.user.id,
                song_file_path: `/${songDestinationName}/${songDestinationName}.ogg`,
                song_title: title,
                song_author: channelTitle || null,
                song_thumbnail_path: thumbnailDestinationName ? `/${thumbnailDestinationName}/${thumbnailDestinationName}.jpg` : null
            });

            return res.status(200).json(Object.keys(createSongQuery.get()).filter((key) => {
                return key !== "user_id"
            }).reduce((prev: object, current: string) => {
                return {
                    ...prev,
                    [current]: createSongQuery[current]
                }
            }, {}));
        } catch (exc) {
            removeFileDirectories(
                path.join(uploadPath, songDestinationName)
            );

            if (thumbnailDestinationName) {
                removeFileDirectories(
                    path.join(uploadPath, thumbnailDestinationName)
                );
            }

            return res.status(500).json({
                message: "Internal server error."
            });
        }
    });

    router.get("/get-songs", auth, createGetSongsQueryOptions, (req: IRelationRequest, res: express.Response): void | express.Response => {
        let filter: { offset: number, limit: number, where: object, order: Order } = {
            offset: req.queryOptions.offset, 
            limit: req.queryOptions.limit,
            where: { user_id: req.user.id + "" },
            order: [["created_at", "DESC"], ["id", "ASC"]]
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

    router.get("/get-song/:id", auth, async (req: IAuthRequest, res: express.Response) => {
        try {
            const songQuery = await Song.findOne({
                where: {
                    user_id: req.user.id + "",
                    id: req.params.id + ""
                }
            });

            if (!songQuery) {
                return res.status(401).json({
                    message: "Client does not have access to that item."
                });
            }

            const song = songQuery.get();

            let row = {}

            for (let i in song) {
                if (i !== "user_id") {
                    row[i] = song[i];
                }
            }

            return res.status(200).json({
                row
            });
        } catch (err: any) {
            console.error("Internal server error: ", err.message);

            return res.status(500).json({
                message: "Internal server error."
            });
        }
    });

    router.get("/get-thumbnail/:id", auth, async (req: IUploadSongRequest, res: express.Response) => {
        if (req.params.id) {
            try {
                const songQuery = await Song.findOne({
                    where: {
                        user_id: req.user.id + "",
                        song_thumbnail_path: `/${req.params.id.split(".")[0]}/${req.params.id}`
                    }
                });

                if (!songQuery) {
                    return res.status(401).json({
                        message: "Failed to find thumbnail with that id."
                    });
                }

                const result = songQuery.get();

                const filePath: string = path.join(uploadPath, result.song_thumbnail_path);

                return res.sendFile(filePath);
            } catch (err: any) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }
        } else {
            return res.status(401).json({
                message: "Failed to find thumbnail with that id."
            });
        }
    });

    router.get("/:id", auth, async (req: IAuthRequest, res: express.Response) => {
        let range = req.headers.range;

        if (isNaN(parseInt(req.params.id))) {
            return res.status(401).json({
                message: "Invalid url parameter for id."
            });
        }
        
        try {
            const songQuery = await Song.findOne({
                where: {
                    user_id: req.user.id + "",
                    id: req.params.id + ""
                }
            });

            if (!songQuery) {
                return res.status(401).json({
                    message: "Client is not authorized to access that file."
                });
            }

            const result = songQuery.get();

            const songPath = path.join(uploadPath, result.song_file_path);
            // TODO - add error handling here
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
                } catch (exc) {
                    // TODO - maybe respond with 416 here
                }
            }
            
            res.writeHead(200, {
                "Content-Length": videoSize
            });
        
            const videoStream = fs.createReadStream(songPath);
    
            return videoStream.pipe(res);
        } catch (err: any) {
            return res.status(500).json({
                message: "Internal server error."
            });
        }
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

    router.patch("/remove-from-playlist/:songId/:playlistId", auth, async (req: IAuthRequest, res) => {
        const { songId, playlistId } = req.params;

        if (!songId || isNaN(parseInt(songId))) {
            return res.status(401).json({
                message: "Failed to provide valid song id in url param."
            });
        }
        
        if (!playlistId || isNaN(parseInt(playlistId))) {
            return res.status(401).json({
                message: "Failed to provide valid playlist id in url param."
            });
        }

        const songFindQuery = await Song.findOne({
            where: {
                user_id: req.user.id + "",
                id: songId
            }
        });

        if (!songFindQuery) {
            return res.status(401).json({
                message: "Client does not have access to that song."
            });
        }

        const newArray: Array<number> = songFindQuery.get().song_playlists.filter((playlistId) => {
            return playlistId !== playlistId;
        });

        const songUpdateQuery = await Song.update({
            song_playlists: newArray 
        }, {
            where: {
                user_id: req.user.id + "",
                id: songId
            }
        });

        if (songUpdateQuery[0] === 0) {
            return res.status(401).json({
                message: "Failed to remove song from playlist."
            });
        }

        return res.sendStatus(200);
    });

    return router;
}
