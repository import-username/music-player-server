import * as express from "express";
import initializeRoutes from "./routes/initializeRoutes";

const PORT: number = parseInt(process.env.PORT) || 5000;
const app: express.Express = express();

initializeRoutes(app);

app.get("/", (req: express.Request, res: express.Response): express.Response => {
    return res.status(200).json({
        message: "response!"
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}...`);
});
