"use strict";
exports.__esModule = true;
var Busboy = require("busboy");
var path = require("path");
var fs = require("fs");
var randomFileName_1 = require("../../helper/randomFileName");
var uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
var validAudioExtensions = /.mp3|.mp4|/;
var validImageExtensions = /.png|.jpg|.jpeg/;
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}
function createFileDirectory(name) {
    fs.mkdirSync(path.join(uploadPath, name));
}
function uploadFile(req, res, next) {
    var busboyOptions = {
        headers: req.headers,
        limits: {
            fields: 3,
            files: 2
        }
    };
    var busboy = new Busboy(busboyOptions);
    req.songData = {};
    busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
        if (!req.songData.song_title) {
            return busboy.emit("error", {
                err: new Error("Title field must have first priority in multipart form."),
                statusCode: 401
            });
        }
        if (fieldname === "songFile" && validAudioExtensions.test(path.extname(filename))) {
            var uniqueFilename = Date.now() + "-" + Math.floor(Math.random() * 10E9);
            req.songData.song_file_path = "/" + uniqueFilename + "/" + uniqueFilename + path.extname(filename);
            createFileDirectory(uniqueFilename);
            var fileStream = fs.createWriteStream(path.join(uploadPath, uniqueFilename, uniqueFilename + path.extname(filename)));
            file.pipe(fileStream);
        }
        else if (fieldname === "songThumbnail" && validImageExtensions.test(path.extname(filename))) {
            var thumbnailName = (0, randomFileName_1["default"])();
            var thumbnailPath = "/" + thumbnailName + "/" + thumbnailName + path.extname(filename);
            req.songData.song_thumbnail_path = thumbnailPath;
            createFileDirectory(thumbnailName);
            var fileStream = fs.createWriteStream(path.join(uploadPath, thumbnailName, thumbnailName + path.extname(filename)));
            file.pipe(fileStream);
        }
        else {
            busboy.emit("error", {
                err: new Error("Unauthorized mimetype or field name."),
                statusCode: 401
            });
        }
    });
    busboy.on("field", function (fieldname, value, fieldnameTruncated, valueTruncated, encoding, mimeType) {
        switch (fieldname) {
            case "songTitle":
                if (value.length < 150) {
                    req.songData.song_title = value;
                }
                else {
                    busboy.emit("error", {
                        err: new Error("Song title too large (90 characters max)."),
                        statusCode: 401
                    });
                }
                break;
            case "songAuthor":
                if (value.length < 150) {
                    req.songData.song_author = value;
                }
                else {
                    busboy.emit("error", {
                        err: new Error("Author name too large (90 characters max)."),
                        statusCode: 401
                    });
                }
                break;
            case "songDescription":
                if (value.length < 400) {
                    req.songData.song_description = value;
                }
                else {
                    busboy.emit("error", {
                        err: new Error("Song description too large (400 characters max)."),
                        statusCode: 401
                    });
                }
                break;
        }
    });
    busboy.on("error", function (err) {
        busboy.removeAllListeners();
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
    busboy.on("finish", function () {
        if (req.songData.song_file_path && req.songData.song_title) {
            return next();
        }
        return res.status(401).json({
            message: "Failed to provide all required fields."
        });
    });
    req.pipe(busboy);
}
exports["default"] = uploadFile;
