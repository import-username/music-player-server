import * as express from "express";
import * as Busboy from "busboy";
import * as path from "path";
import * as fs from "fs";

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");

const validExtensions: RegExp = /.mp3|.mp4|.png|.jpg|.jpeg/

// Make uploads directory if it doesn't exist.
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath);
}

function createFileDirectory(name) {
    fs.mkdirSync(path.join(uploadPath, name));
}

export default function uploadFile(req: express.Request, res: express.Response, next: express.NextFunction) {
    const busboyOptions: any = {
        headers: req.headers
    }

    let busboy = new Busboy(busboyOptions);

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        if (fieldname === "songFile" && validExtensions.test(path.extname(filename))) {
            const uniqueFilename: string = Date.now() + "-" + Math.floor(Math.random() * 10E9);

            createFileDirectory(uniqueFilename);

            const fileStream: fs.WriteStream = fs.createWriteStream(path.join(uploadPath, uniqueFilename, uniqueFilename + path.extname(filename)));

            file.pipe(fileStream);

            file.on("end", () => {
                // TODO - query database to create row for file location
            });
        } else {
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