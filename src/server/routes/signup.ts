import * as express from "express";

const router: express.Router = express.Router();

/**
 * Initializes endpoints for /signup route.
 * @returns Router object.
 */
export default function signupRoute(): express.Router {
    /**
     * Endpoint for accepting and verifying requests to create a new user account.
     */
    router.post("/", (req: express.Request, res: express.Response): express.Response => {
        return res.sendStatus(200);
    });

    return router;
}
