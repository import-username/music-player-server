"use strict";
exports.__esModule = true;
function getRandomFileName() {
    var filename = Date.now() + "-" + Math.floor(Math.random() * 10E9);
    return filename;
}
exports["default"] = getRandomFileName;
