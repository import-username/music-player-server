import * as fs from "fs";
import * as path from "path";

const uploadPath: string = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

/**
 * Creates a directory for a user uploaded file with the given name.
 * @param name Name of directory to create in uploads directory.
 */
export default function createFileDirectory(name: string) {
    fs.mkdirSync(path.join(uploadPath, name));
}
