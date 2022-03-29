import * as busboy from "busboy";
import PQueue from "p-queue";
import * as path from "path";
import * as fs from "fs";
import createFileDirectory from "../../helper/createFileDirectory";

const uploadPath: string = process.env.UPLOAD_DIR;

const validExtensions: RegExp = /.jpg|.png/;

function fileUploadError(message: string, status: number) {
    return {
        message,
        status
    }
}

export default function uploadPlaylist(req, res, next) {
    const eventQueue = new PQueue({ concurrency: 1 });

    const bus = busboy({ headers: req.headers, limits: {
        fields: 1,
        files: 1,
        fileSize: 10000000,
        parts: 2
    }});

    function handleUpload(cb) {
        eventQueue.add(async () => {
            try {
                await cb();
            } catch (err) {
                bus.removeAllListeners();

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

    bus.on("file", (fieldname, file, filename, encoding, mimetype) => {
        handleUpload(() => {
            // If playlist title field was not sent and validated before file, throw error.
            if (!req.playlistTitle) {
                throw fileUploadError("Playlist title field must appear in multipart data before file.", 401);
            }

            if (fieldname === "playlistThumbnail" && validExtensions.test(path.extname(filename))) {
                const uniqueFilename: string = Date.now() + "-" + Math.floor(Math.random() * 10E9);

                req.playlist_thumbnail_path = `/${uniqueFilename}/${uniqueFilename}${path.extname(filename)}`;

                createFileDirectory(uniqueFilename);

                const filepath: string = path.join(uploadPath, req.playlist_thumbnail_path);

                const thumbnailWriteStream = fs.createWriteStream(filepath);

                file.pipe(thumbnailWriteStream);
            } else {
                throw fileUploadError(`Invalid mimetype or field name.`, 401);
            }
        });
    });

    bus.on("field", (fieldname, value, fT, vT, enc, mimeType) => {
        handleUpload(() => {
            switch (fieldname) {
                case "playlistTitle":
                    const titleMax: number = 150;

                    if (value.length > titleMax) {
                        throw fileUploadError("Playlist title too large. Max " + titleMax + " characters.", 401);
                    }

                    if (value.length < 1) {
                        throw fileUploadError("Playlist title too small. Min 1 character.", 401);
                    }
    
                    req.playlistTitle = value;

                    break;
                default:
                    throw fileUploadError("Invalid multipart field: " + fieldname, 401);
            }
        });
    });

    bus.on("finish", () => {
        if (req.playlistTitle) {
            return next();
        }

        return res.status(401).json({
            message: "Failed to provide all required fields."
        });
    });

    req.pipe(bus);
}