"use strict";
exports.__esModule = true;
var Busboy = require("busboy");
var path = require("path");
var fs = require("fs");
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
            var uniqueFilename = Date.now() + "-" + Math.floor(Math.random() * 10E9);
            createFileDirectory(uniqueFilename);
            var fileStream = fs.createWriteStream(path.join(uploadPath, uniqueFilename, uniqueFilename + path.extname(filename)));
            file.pipe(fileStream);
            file.on("end", function () {
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
