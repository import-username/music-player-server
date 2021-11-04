import * as express from "express";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";
import Songs from "../tables/songs";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
import { ISaveQuery } from "../../ts/interfaces/songs";

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

const validExtensions: RegExp = /.mp3|.mp4|.png|.jpg|.jpeg/;

// Make uploads directory if it doesn't exist.
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

function createFileDirectory(name) {
    fs.mkdirSync(path.join(uploadPath, name));
}

export default function uploadFile(req: IAuthRequest, res: express.Response, next: express.NextFunction) {
    const busboyOptions: any = {
        headers: req.headers
    }

    let busboy = new Busboy(busboyOptions);

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname === "songFile" && validExtensions.test(path.extname(filename))) {
            const uniqueFilename: string = Date.now() + "-" + Math.floor(Math.random() * 10E9);
            
            const saveQueryData: ISaveQuery = {
                id: "DEFAULT",
                user_id: req.user.id,
                song_file_path: `/${uniqueFilename}/${uniqueFilename}${path.extname(filename)}`,
                song_title: path.basename(filename, path.extname(filename)),
                song_thumbnail_path: "NULL",
                song_description: "NULL",
                song_author: "NULL",
                song_playlists: "DEFAULT",
                song_favorite: "FALSE"
            }

            Songs.save(saveQueryData, (err: Error, result: string) => {
                if (err) {
                    busboy.removeAllListeners();
                    
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                createFileDirectory(uniqueFilename);
    
                const fileStream: fs.WriteStream = fs.createWriteStream(path.join(uploadPath, uniqueFilename, uniqueFilename + path.extname(filename)));
                
                file.pipe(fileStream);
            });
        } else {
            busboy.removeAllListeners();

            return res.status(401).json({
                message: "Unauthorized mimetype or field name."
            });
        }
    });

    busboy.on("finish", () => {
        return next();
    });
    
    req.pipe(busboy);
}
