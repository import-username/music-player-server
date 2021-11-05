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
function songRoute() {
    router.post("/upload-song", auth_1["default"], uploadFile_1["default"], function (req, res) {
        return res.sendStatus(200);
    });
    router.get("/get-songs", auth_1["default"], createGetSongsQueryOptions_1["default"], function (req, res) {
        songs_1["default"].find({ user_id: req.user.id }, req.queryOptions, function (err, result) {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }
            var response = {
                tables: result.rows.map(function (row) {
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
    return router;
}
exports["default"] = songRoute;
