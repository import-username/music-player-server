import * as express from "express";
import signupRoute from "./signup";
import loginRoute from "./login";
import authenticateRoute from "./authenticate";

/**
 * Adds route objects to application middleware.
 * @param app Express application object.
 */
export default function initializeRoutes(app: express.Express): void {
    app.use("/signup", signupRoute());
    app.use("/login", loginRoute());
    app.use("/authenticate", authenticateRoute());
}