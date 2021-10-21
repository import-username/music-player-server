import * as express from "express";

const PORT: number = parseInt(process.env.PORT) || 5000;
const app: express.Express = express();

app.get("/", (req: express.Request, res: express.Response): void => {
    res.status(200).json({
        message: "response!"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}...`);
});
