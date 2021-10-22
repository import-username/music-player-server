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

        if (req.body.password.length < 8) {
            return res.status(401).json({
                message: "Password must be at least 8 characters."
            });
        }

        // Query for row with email from users table.
        Users.findByEmail(req.body.email, (err: Error, user: IUserQuery) => {
            if (err) {
                return res.status(500).json({
                    message: "Internal server error."
                });
            }

            // Respond with 401 if row is found.
            if (user) {
                return res.status(401).json({
                    message: "User with that email already exists."
                });
            }

            // Hash and salt password if user is not found.
            bcrypt.hash(req.body.password, 10, (err: Error, hash) => {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                // Query database to create new user row in users table.
                Users.save(req.body.email, hash, (err: Error, result: string) => {
                    if (err) {
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
