import * as express from "express";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";
import PQueue from "p-queue";
import { IUploadSongRequest } from "../../ts/interfaces/songs";
import getRandomFileName from "../../helper/randomFileName";
import * as ffmpeg from "fluent-ffmpeg";

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

const validAudioExtensions: RegExp = /.mp3|.mp4|.ogg|.wav/;
const validImageExtensions: RegExp = /.png|.jpg|.jpeg/;

// Make uploads directory if it doesn't exist.
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

/**
 * Creates a directory for a user uploaded file with the given name.
 * @param name Name of directory to create in uploads directory.
 */
function createFileDirectory(name: string) {
    fs.mkdirSync(path.join(uploadPath, name));
}

function fileUploadError(message: string, status: number) {
    return {
        message,
        status
    }
}

/**
 * Middleware for parsing multipart form data and creating user uploaded files.
 */
export default function uploadFile(req: IUploadSongRequest, res: express.Response, next: express.NextFunction) {
    const eventQueue = new PQueue({ concurrency: 1 });

    // TODO - add file size limit
    const busboyOptions: Busboy.BusboyConfig = {
        headers: <Busboy.BusboyHeaders> req.headers,
        limits: {
            fields: 3,
            files: 2
        }
    }

    let busboy: Busboy.Busboy = new Busboy(busboyOptions);

    req.songData = {};

    function handleUpload(cb) {
        eventQueue.add(async () => {
            try {
                await cb();
            } catch (err) {
                busboy.removeAllListeners();

                eventQueue.pause();

                if (err instanceof Error) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                } else {
                    return res.status(err.status).json({
                        message: err.message
                    });
                }
            }
        });
    }

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        handleUpload(() => {
            /**
             * If title is not on songData object before file event is fired,
             * song title part did not have first priority in multipart form.
             */
            if (!req.songData.song_title) {
                throw fileUploadError("Title field must have first priority in multipart form.", 401);
            }

            /**
             * Song file field must be the first file field (Second part in multipart form).
             */
            if (fieldname !== "songFile" && !req.songData.song_file_path) {
                throw fileUploadError("Song file field must have second priority in multipart form order.", 401);
            }
    
            if (fieldname === "songFile" && validAudioExtensions.test(path.extname(filename))) {
                const uniqueFilename: string = Date.now() + "-" + Math.floor(Math.random() * 10E9);
    
                req.songData.song_file_path = `/${uniqueFilename}/${uniqueFilename}.ogg`;
    
                createFileDirectory(uniqueFilename);

                // TODO - make multiple versions of file with different bitrates.
                let ffmpegCommand: ffmpeg.FfmpegCommand = ffmpeg(file);

                ffmpegCommand.withAudioCodec("libvorbis");
                ffmpegCommand.outputOption("-vn");
                ffmpegCommand.outputOption("-q:a 7");

                ffmpegCommand.addOutput(path.join(uploadPath, uniqueFilename, uniqueFilename + ".ogg"));

                ffmpegCommand.run();
            } else if (fieldname === "songThumbnail" && validImageExtensions.test(path.extname(filename))) {
                const thumbnailName = getRandomFileName();
                const thumbnailPath = `/${thumbnailName}/${thumbnailName}${path.extname(filename)}`
    
                req.songData.song_thumbnail_path = thumbnailPath;
    
                createFileDirectory(thumbnailName);
    
                const fileStream: fs.WriteStream = fs.createWriteStream(path.join(uploadPath, thumbnailName, thumbnailName + path.extname(filename)));
                
                file.pipe(fileStream);
            } else {
                throw fileUploadError("Unauthorized mimetype or field name.", 401);
            }
        });
    });

    busboy.on("field", (fieldname, value, fT, vT, enc, mimeType) => {
        handleUpload(() => {
            switch (fieldname) {
                case "songTitle":
                    const titleMax: number = 150;
    
                    if (value.length > 1 && value.length < titleMax) {
                        req.songData.song_title = value;
                    } else {
                        throw fileUploadError(`Song title too small or too large. (1 min, ${titleMax} max characters).`, 401);
                    }
                    break;
                case "songAuthor":
                    const authorMax: number = 150;
                    
                    if (value.length > 1 && value.length < authorMax) {
                        req.songData.song_author = value;
                    } else {
                        throw fileUploadError(`Author name too small or too large (1 min, ${authorMax} max characters).`, 401);
                    }
                    break;
                case "songDescription":
                    if (value.length < 400) {
                        req.songData.song_description = value;
                    } else {
                        throw fileUploadError("Song description too large (400 characters max).", 401);
                    }
                    break;
            }
        });
    });

    busboy.on("finish", () => {
        if (req.songData.song_file_path && req.songData.song_title) {
            return next();
        }

        return res.status(401).json({
            message: "Failed to provide all required fields."
        });
    });
    
    req.pipe(busboy);
}
