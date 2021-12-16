import * as express from "express";
import { IUserQuery } from "../../ts/interfaces/users";
import User from "../tables/user";
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
        User.findOne({
            where: {
                email: req.body.email
            }
        }).then((query) => {
            if (query) {
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

                // Query database to create new user row in users table.
                User.create({
                    email: req.body.email,
                    password: hash
                }).then((create) => {
                    return res.status(200).json({
                        message: "Account created."
                    });
                }).catch((saveError: Error) => {
                    console.error("Internal server error: ", saveError.message);

                    return res.status(500).json({
                        message: "Internal server error."
                    });
                });
            });
        }).catch((err) => {
            console.error("Internal server error: ", err.message);

            return res.status(500).json({
                message: "Internal server error."
            });
        });
    });

    return router;
}
