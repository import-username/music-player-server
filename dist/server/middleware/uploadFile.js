"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Busboy = require("busboy");
var path = require("path");
var fs = require("fs");
var p_queue_1 = require("p-queue");
var randomFileName_1 = require("../../helper/randomFileName");
var uploadPath = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
var validAudioExtensions = /.mp3|.mp4/;
var validImageExtensions = /.png|.jpg|.jpeg/;
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}
function createFileDirectory(name) {
    fs.mkdirSync(path.join(uploadPath, name));
}
function fileUploadError(message, status) {
    return {
        message: message,
        status: status
    };
}
function uploadFile(req, res, next) {
    var eventQueue = new p_queue_1["default"]({ concurrency: 1 });
    var busboyOptions = {
        headers: req.headers,
        limits: {
            fields: 3,
            files: 2
        }
    };
    var busboy = new Busboy(busboyOptions);
    req.songData = {};
    function handleUpload(cb) {
        var _this = this;
        eventQueue.add(function () { return __awaiter(_this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4, cb()];
                    case 1:
                        _a.sent();
                        return [3, 3];
                    case 2:
                        err_1 = _a.sent();
                        busboy.removeAllListeners();
                        eventQueue.pause();
                        if (err_1 instanceof Error) {
                            return [2, res.status(500).json({
                                    message: "Internal server error."
                                })];
                        }
                        else {
                            return [2, res.status(err_1.status).json({
                                    message: err_1.message
                                })];
                        }
                        return [3, 3];
                    case 3: return [2];
                }
            });
        }); });
    }
    busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
        handleUpload(function () {
            if (!req.songData.song_title) {
                throw fileUploadError("Title field must have first priority in multipart form.", 401);
            }
            if (fieldname !== "songFile" && !req.songData.song_file_path) {
                throw fileUploadError("Song file field must have second priority in multipart form order.", 401);
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
                throw fileUploadError("Unauthorized mimetype or field name.", 401);
            }
        });
    });
    busboy.on("field", function (fieldname, value, fT, vT, enc, mimeType) {
        handleUpload(function () {
            switch (fieldname) {
                case "songTitle":
                    var titleMax = 150;
                    if (value.length > 1 && value.length < titleMax) {
                        req.songData.song_title = value;
                    }
                    else {
                        throw fileUploadError("Song title too small or too large. (1 min, " + titleMax + " max characters).", 401);
                    }
                    break;
                case "songAuthor":
                    var authorMax = 150;
                    if (value.length > 1 && value.length < authorMax) {
                        req.songData.song_author = value;
                    }
                    else {
                        throw fileUploadError("Author name too small or too large (1 min, " + authorMax + " max characters).", 401);
                    }
                    break;
                case "songDescription":
                    if (value.length < 400) {
                        req.songData.song_description = value;
                    }
                    else {
                        throw fileUploadError("Song description too large (400 characters max).", 401);
                    }
                    break;
            }
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
