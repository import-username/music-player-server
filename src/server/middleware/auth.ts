import * as express from "express";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { IAuthRequest } from "../../ts/interfaces/authenticatedRequest";
dotenv.config();

/**
 * Middleware for authenticating client requests.
 */
export default function auth(req: IAuthRequest, res: express.Response, next: express.NextFunction): express.Response | void {
    const authCookie: string = req.cookies["cookie.auth"];
    
    // If cookie named cookie.auth could not be found in cookie header, respond with 401.
    if (!authCookie) {
        return res.status(401).json({
            message: "Failed to authenticate user."
        });
    }

    // Verify cookie with jwt secret
    jwt.verify(authCookie, process.env.JWT_SECRET, (err: Error, decoded: jwt.JwtPayload) => {
        if (err) {
            return res.status(401).json({
                message: "Failed to authenticate user."
            });
        }

        // Respond with 401 if not valid.
        if (!decoded) {
            return res.status(401).json({
                message: "Failed to authenticate user."
            });
        }

        // Add user object to request object
        req.user = {
            id: decoded.id
        }

        // Continue request to next middleware/endpoint if all conditionals pass.
        return next();
    });
}