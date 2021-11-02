"use strict";
exports.__esModule = true;
var Busboy = require("busboy");
var path = require("path");
var fs = require("fs");
var Songs = require("../tables/songs");
var uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
var validExtensions = /.mp3|.mp4|.png|.jpg|.jpeg/;
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}
function createFileDirectory(name) {
    fs.mkdirSync(path.join(uploadPath, name));
}
function uploadFile(req, res, next) {
    var busboyOptions = {
        headers: req.headers
    };
    var busboy = new Busboy(busboyOptions);
    busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
        if (fieldname === "songFile" && validExtensions.test(path.extname(filename))) {
            var uniqueFilename_1 = Date.now() + "-" + Math.floor(Math.random() * 10E9);
            Songs.save(req.user.id, "/" + uniqueFilename_1 + "/" + uniqueFilename_1 + path.extname(filename), path.basename(filename, path.extname(filename)), function (err, result) {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }
                createFileDirectory(uniqueFilename_1);
                var fileStream = fs.createWriteStream(path.join(uploadPath, uniqueFilename_1, uniqueFilename_1 + path.extname(filename)));
                file.pipe(fileStream);
            });
        }
        else {
            return res.status(401).json({
                message: "Unauthorized mimetype or field name."
            });
        }
    });
    busboy.on("finish", function () {
        return next();
    });
    req.pipe(busboy);
}
exports["default"] = uploadFile;
