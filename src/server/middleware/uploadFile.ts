import * as express from "express";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";
import { IUploadFileError, IUploadSongRequest } from "../../ts/interfaces/songs";
import getRandomFileName from "../../helper/randomFileName";

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

const validAudioExtensions: RegExp = /.mp3|.mp4|/;
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

/**
 * Middleware for parsing multipart form data and creating user uploaded files.
 */
export default function uploadFile(req: IUploadSongRequest, res: express.Response, next: express.NextFunction) {
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

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        /**
         * If title is not on songData object before file event is fired,
         * song title part did not have first priority in multipart form.
         */
        if (!req.songData.song_title) {
            return busboy.emit("error", {
                err: new Error("Title field must have first priority in multipart form."),
                statusCode: 401
            });
        }

        if (fieldname === "songFile" && validAudioExtensions.test(path.extname(filename))) {
            const uniqueFilename: string = Date.now() + "-" + Math.floor(Math.random() * 10E9);

            req.songData.song_file_path = `/${uniqueFilename}/${uniqueFilename}${path.extname(filename)}`;

            createFileDirectory(uniqueFilename);
    
            const fileStream: fs.WriteStream = fs.createWriteStream(path.join(uploadPath, uniqueFilename, uniqueFilename + path.extname(filename)));
            
            file.pipe(fileStream);
        } else if (fieldname === "songThumbnail" && validImageExtensions.test(path.extname(filename))) {
            const thumbnailName = getRandomFileName();
            const thumbnailPath = `/${thumbnailName}/${thumbnailName}${path.extname(filename)}`

            req.songData.song_thumbnail_path = thumbnailPath;

            createFileDirectory(thumbnailName);

            const fileStream: fs.WriteStream = fs.createWriteStream(path.join(uploadPath, thumbnailName, thumbnailName + path.extname(filename)));
            
            file.pipe(fileStream);
        } else {
            busboy.emit("error", {
                err: new Error("Unauthorized mimetype or field name."),
                statusCode: 401
            });
        }
    });

    busboy.on("field", (fieldname, value, fieldnameTruncated, valueTruncated, encoding, mimeType) => {
        switch (fieldname) {
            case "songTitle":
                if (value.length < 150) {
                    req.songData.song_title = value;
                } else {
                    busboy.emit("error", {
                        err: new Error("Song title too large (90 characters max)."),
                        statusCode: 401
                    });
                }
                break;
            case "songAuthor":
                if (value.length < 150) {
                    req.songData.song_author = value;
                } else {
                    busboy.emit("error", {
                        err: new Error("Author name too large (90 characters max)."),
                        statusCode: 401
                    });
                }
                break;
            case "songDescription":
                if (value.length < 400) {
                    req.songData.song_description = value;
                } else {
                    busboy.emit("error", {
                        err: new Error("Song description too large (400 characters max)."),
                        statusCode: 401
                    });
                }
                break;
        }
    });

    busboy.on("error", (err: Error | IUploadFileError) => {
        // Remove all event listeners to stop event pipeline from continuing further.
        busboy.removeAllListeners();

        // Remove uploaded file directories if they have been created.
        if (req.songData.song_file_path) {
            fs.rmSync(path.join(uploadPath, req.songData.song_file_path), { recursive: true, force: true });
        }

        if (req.songData.song_thumbnail_path) {
            fs.rmSync(path.join(uploadPath, req.songData.song_thumbnail_path), { recursive: true, force: true });
        }

        if (err instanceof Error) {
            return res.status(500).json({
                message: "Internal server error."
            });
        }

        return res.status(err.statusCode).json({
            message: err.err.message
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
