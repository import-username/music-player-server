import * as express from "express";
import { IUserQuery } from "../../ts/interfaces/users";
import * as Users from "../tables/users";
import * as bcrypt from "bcrypt";

const router: express.Router = express.Router();

router.use(express.json());

/**
 * Initializes endpoints for /signup route.
 * @returns Router object.
 */
export default function signupRoute(): express.Router {
    /**
     * Endpoint for accepting and verifying requests to create a new user account.
     */
    router.post("/", (req: express.Request, res: express.Response): void | express.Response => {
        if (!(req.body.email) || !(req.body.password)) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }

        Users.findByEmail(req.body.email, (err: Error, user: IUserQuery) => {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            if (user) {
                return res.status(401).json({
                    message: "User with that email already exists."
                });
            }

            bcrypt.hash(req.body.password, 10, (err: Error, hash) => {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                Users.save(req.body.email, hash, (err: Error, result: string) => {
                    if (err) {
                        console.debug(err);
                        return res.status(500).json({
                            message: "Internal server error."
                        });
                    }

                    return res.status(200).json({
                        message: "Account created."
                    });
                });
            });
        });
    });

    return router;
}
