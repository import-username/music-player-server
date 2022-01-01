"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var express = require("express");
var auth_1 = require("../middleware/auth");
var path = require("path");
var fs = require("fs");
var uploadFile_1 = require("../middleware/uploadFile");
var song_1 = require("../tables/song");
var songs_1 = require("../tables/songs");
var createGetSongsQueryOptions_1 = require("../middleware/createGetSongsQueryOptions");
var sequelize_1 = require("sequelize");
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
                return res.status(200).json(Object.keys(saveQuery.get()).filter(function (key) {
                    return key !== "user_id";
                }).reduce(function (prev, current) {
                    var _a;
                    return __assign(__assign({}, prev), (_a = {}, _a[current] = saveQuery[current], _a));
                }, {}));
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
        var _a;
        var filter = {
            offset: req.queryOptions.offset,
            limit: req.queryOptions.limit,
            where: { user_id: req.user.id + "" }
        };
        if (req.query.titleIncludes) {
            filter.where["song_title"] = (_a = {},
                _a[sequelize_1.Op.iLike] = "%" + req.query.titleIncludes + "%",
                _a);
        }
        song_1["default"].findAll(filter).then(function (query) {
            var response = {
                rows: query.map(function (item) {
                    var itemData = item.get();
                    var rowObj = {};
                    for (var i in itemData) {
                        if (i !== "user_id") {
                            rowObj[i] = itemData[i];
                        }
                    }
                    return rowObj;
                })
            };
            if (req.queryOptions.includeTotal) {
                song_1["default"].count({
                    where: { user_id: req.user.id + "" }
                }).then(function (countQuery) {
                    response.total = countQuery;
                    return res.status(200).json(response);
                })["catch"](function (err) {
                    console.error("Internal server error: ", err.message);
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                });
            }
            else {
                return res.status(200).json(response);
            }
        })["catch"](function (err) {
            console.error("Internal server error: ", err.message);
            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });
    router.get("/get-song/:id", auth_1["default"], function (req, res) {
        song_1["default"].findOne({
            where: {
                user_id: req.user.id + "",
                id: req.params.id + ""
            }
        }).then(function (songQuery) {
            console.log(songQuery);
            return res.sendStatus(200);
        })["catch"](function (err) {
            console.error("Internal server error: ", err.message);
            return res.status(500).json({
                message: "Internal server error."
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
                try {
                    var startByte = Number(range.replace(/\D/g, ""));
                    var endByte = Math.min(startByte + (Math.pow(10, 6)), videoSize - 1);
                    var videoStream_1 = fs.createReadStream(songPath, { start: startByte, end: endByte });
                    var headers = {
                        "Content-Range": "bytes " + startByte + "-" + endByte + "/" + videoSize,
                        "Accept-Ranges": "bytes",
                        "Content-Length": videoSize,
                        "Content-Type": "audio/ogg"
                    };
                    res.writeHead(206, headers);
                    return videoStream_1.pipe(res);
                }
                catch (exc) { }
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
