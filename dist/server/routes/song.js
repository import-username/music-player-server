"use strict";
exports.__esModule = true;
var express = require("express");
var auth_1 = require("../middleware/auth");
var path = require("path");
var fs = require("fs");
var uploadFile_1 = require("../middleware/uploadFile");
var router = express.Router();
var uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}
function songRoute() {
    router.post("/upload-song", auth_1["default"], uploadFile_1["default"], function (req, res) {
        return res.sendStatus(200);
    });
    return router;
}
exports["default"] = songRoute;
