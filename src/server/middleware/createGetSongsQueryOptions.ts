import * as express from "express";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import { IFindQueryOptions, IRelationRequest } from "../../ts/interfaces/relation";

export default function createGetSongsQueryOptions(req: IRelationRequest, res: express.Response, next: express.NextFunction): void {
    let queryOptions: IFindQueryOptions = {
        limit: 100,
        offset: 0,
        includeTotal: false
    }

    if (req.query.limit && !isNaN(parseInt(<string> req.query.limit))) {
        queryOptions.limit = Math.min(parseInt(<string> req.query.limit), <number> queryOptions.limit);
    }

    if (req.query.skip && !isNaN(parseInt(<string> req.query.skip))) {
        queryOptions.offset = parseInt(<string> req.query.skip);
    } else if (req.query.offset && !isNaN(parseInt(<string> req.query.offset))) {
        queryOptions.offset = parseInt(<string> req.query.offset);
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
