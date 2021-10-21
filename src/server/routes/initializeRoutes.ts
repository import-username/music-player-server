import * as express from "express";
import signupRoute from "./signup";

/**
 * Adds route objects to application middleware.
 * @param app Express application object.
 */
export default function initializeRoutes(app: express.Express): void {
    app.use("/signup", signupRoute());
}