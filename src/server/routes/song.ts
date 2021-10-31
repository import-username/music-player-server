import * as express from "express";
import auth from "../middleware/auth";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";
import uploadFile from "../middleware/uploadFile";

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

    return router;
}
