/**
 * Generates a randomish string for filenames.
 * @returns Random string.
 */
export default function getRandomFileName(): string {
    const filename: string = Date.now() + "-" + Math.floor(Math.random() * 10E9);

    return filename;
}