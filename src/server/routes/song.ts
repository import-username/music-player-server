import * as express from "express";
import auth from "../middleware/auth";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";
import uploadFile from "../middleware/uploadFile";
import Songs from "../tables/songs";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import createGetSongsQueryOptions from "../middleware/createGetSongsQueryOptions";
import { IRelationRequest } from "../../ts/interfaces/relation";

const router: express.Router = express.Router();

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

// Make uploads directory if it doesn't exist.
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

export default function songRoute(): express.Router {
    router.post("/upload-song", auth, uploadFile, (req: express.Request, res: express.Response): void | express.Response => {
        return res.sendStatus(200);
    });

    router.get("/get-songs", auth, createGetSongsQueryOptions, (req: IRelationRequest, res: express.Response): void | express.Response => {
        Songs.find({ user_id: req.user.id }, req.queryOptions, (err: Error, result: any) => {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            let response: any = {
                tables: result.rows.map((row) => {
                    let rowObj = {};
        
                    for (let i in row) {
                        if (i !== "id" && i !== "user_id") {
                            rowObj[i] = row[i];
                        }
                    }
        
                    return rowObj;
                })
            }
            
            if (result.total) {
                response.total = result.total;
            }

            return res.status(200).json(response);
        });
    });

    return router;
}
