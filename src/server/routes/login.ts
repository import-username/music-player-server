import * as express from "express";
import { IUserQuery } from "../../ts/interfaces/users";
import * as Users from "../tables/users";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
dotenv.config();

const router: express.Router = express();

router.use(express.json());

export default function loginRoute(): express.Router {
    router.post("/", (req: express.Request, res: express.Response) => {
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

            if (!user) {
                return res.status(401).json({
                    message: "Invalid email or password."
                });
            }

            bcrypt.compare(req.body.password, user.password, (err: Error, validPassword: boolean) => {
                if (err) {
                    return res.status(500).json({
                        message: "Internal server error."
                    });
                }

                if (!validPassword) {
                    return res.status(401).json({
                        message: "Invalid email or password."
                    });
                }

                const JWT: string = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "31d"});
                
                const cookieOptions: express.CookieOptions = {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 * 722 // 1 second => 1 minute => 1 hour => 722 hours
                }

                return res.status(200).cookie("cookie.auth", JWT, cookieOptions).json({
                    message: "Successfully logged in."
                });
            });
        });
    });
    
    return router;
}
