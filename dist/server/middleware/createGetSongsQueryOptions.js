"use strict";
exports.__esModule = true;
function createGetSongsQueryOptions(req, res, next) {
    var queryOptions = {};
    if (req.query.limit && !isNaN(parseInt(req.query.limit))) {
        queryOptions.limit = parseInt(req.query.limit);
    }
    if (req.query.skip && !isNaN(parseInt(req.query.skip))) {
        queryOptions.skip = parseInt(req.query.skip);
    }
    else if (req.query.offset && !isNaN(parseInt(req.query.offset))) {
        queryOptions.offset = parseInt(req.query.offset);
    }
    if (req.query.includeTotal && (req.query.includeTotal === "false" || req.query.includeTotal === "true")) {
        switch (req.query.includeTotal) {
            case "false":
                queryOptions.includeTotal = false;
                break;
            case "true":
                queryOptions.includeTotal = true;
                break;
        }
    }
    req.queryOptions = queryOptions;
    return next();
}
exports["default"] = createGetSongsQueryOptions;
