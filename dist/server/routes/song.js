"use strict";
exports.__esModule = true;
var express = require("express");
var auth_1 = require("../middleware/auth");
var path = require("path");
var fs = require("fs");
var uploadFile_1 = require("../middleware/uploadFile");
var song_1 = require("../tables/song");
var songs_1 = require("../tables/songs");
var createGetSongsQueryOptions_1 = require("../middleware/createGetSongsQueryOptions");
var router = express.Router();
var uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}
function removeFileDirectories() {
    var paths = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        paths[_i] = arguments[_i];
    }
    paths.forEach(function (fileDir) {
        fs.rmSync(fileDir, { recursive: true, force: true });
    });
}
function songRoute() {
    router.post("/upload-song", auth_1["default"], uploadFile_1["default"], function (req, res) {
        if (req.songData.song_title) {
            var saveQueryData = {
                user_id: req.user.id,
                song_file_path: req.songData.song_file_path,
                song_title: req.songData.song_title,
                song_thumbnail_path: req.songData.song_thumbnail_path || "NULL",
                song_description: req.songData.song_description || "NULL",
                song_author: req.songData.song_author || "NULL",
                song_playlists: [],
                song_favorite: "FALSE"
            };
            song_1["default"].create(saveQueryData).then(function (saveQuery) {
                return res.status(200).json({
                    message: "Song successfully created."
                });
            })["catch"](function (err) {
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
        }
        else {
            removeFileDirectories(path.join(uploadPath, req.songData.song_file_path), path.join(uploadPath, req.songData.song_thumbnail_path));
            return res.status(401).json({
                message: "Failed to provide song title (Required field)."
            });
        }
    });
    router.get("/get-songs", auth_1["default"], createGetSongsQueryOptions_1["default"], function (req, res) {
        songs_1["default"].find({ user_id: req.user.id }, req.queryOptions, function (err, result) {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }
            var response = {
                rows: result.rows.map(function (row) {
                    var rowObj = {};
                    for (var i in row) {
                        if (i !== "user_id") {
                            rowObj[i] = row[i];
                        }
                    }
                    return rowObj;
                })
            };
            if (result.total) {
                response.total = result.total;
            }
            return res.status(200).json(response);
        });
    });
    router.get("/get-song/:id", auth_1["default"], function (req, res) {
        songs_1["default"].findOne({ user_id: req.user.id, id: req.params.id }, function (err, result) {
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
            var row = {};
            for (var i in result) {
                if (i !== "user_id") {
                    row[i] = result[i];
                }
            }
            return res.status(200).json({
                row: row
            });
        });
    });
    router.get("/get-thumbnail/:id", auth_1["default"], function (req, res) {
        if (req.params.id) {
            songs_1["default"].findOne({
                user_id: req.user.id,
                song_thumbnail_path: "/" + req.params.id.split(".")[0] + "/" + req.params.id
            }, function (err, result) {
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
                var filePath = path.join(__dirname, "..", "..", "uploads", result.song_thumbnail_path);
                return res.sendFile(filePath);
            });
        }
        else {
            return res.status(401).json({
                message: "Failed to find thumbnail with that id."
            });
        }
    });
    router.get("/:id", auth_1["default"], function (req, res) {
        var range = req.headers.range;
        if (isNaN(parseInt(req.params.id))) {
            return res.status(401).json({
                message: "Invalid url parameter for id."
            });
        }
        songs_1["default"].findOne({ user_id: req.user.id, id: req.params.id }, function (err, result) {
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
            var songPath = path.join(uploadPath, result.song_file_path);
            var videoSize = fs.statSync(songPath).size;
            if (range && !isNaN(parseInt(range.replace(/\D/g, "")))) {
                var startByte = Number(range.replace(/\D/g, ""));
                var endByte = (startByte + (Math.pow(10, 6))) > videoSize ? videoSize - 1 : (startByte + (Math.pow(10, 6)));
                var contentLength = endByte - startByte + 1;
                var headers = {
                    "Content-Range": "bytes " + startByte + "-" + endByte + "/" + videoSize,
                    "Accept-Ranges": "bytes",
                    "Content-Length": contentLength,
                    "Content-Type": "audio/mp3"
                };
                res.writeHead(206, headers);
                var videoStream_1 = fs.createReadStream(songPath, { start: startByte, end: endByte });
                return videoStream_1.pipe(res);
            }
            res.writeHead(200, {
                "Content-Length": videoSize
            });
            var videoStream = fs.createReadStream(songPath);
            return videoStream.pipe(res);
        });
    });
    return router;
}
exports["default"] = songRoute;
