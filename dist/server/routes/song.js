"use strict";
exports.__esModule = true;
var express = require("express");
var auth_1 = require("../middleware/auth");
var path = require("path");
var fs = require("fs");
var uploadFile_1 = require("../middleware/uploadFile");
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
                id: "DEFAULT",
                user_id: req.user.id,
                song_file_path: req.songData.song_file_path,
                song_title: req.songData.song_title,
                song_thumbnail_path: req.songData.song_thumbnail_path || "NULL",
                song_description: req.songData.song_description || "NULL",
                song_author: req.songData.song_author || "NULL",
                song_playlists: "DEFAULT",
                song_favorite: "FALSE"
            };
            songs_1["default"].save(saveQueryData, function (err, result) {
                if (err) {
                    removeFileDirectories(path.join(uploadPath, req.songData.song_file_path), path.join(uploadPath, req.songData.song_thumbnail_path));
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }
                return res.status(200).json({
                    message: "Song successfully created."
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
                        if (i !== "id" && i !== "user_id") {
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
    return router;
}
exports["default"] = songRoute;
