import * as express from "express";
import auth from "../middleware/auth";

const router: express.Router = express.Router();

export default function authenticateRoute(): express.Router {
    router.get("/", auth, (req: express.Request, res: express.Response) => {
        return res.sendStatus(200);
    });
    
    return router;
}
