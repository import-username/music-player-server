import * as pg from "pg";
import * as dotenv from "dotenv";
import { IConnectionConfig } from "../../ts/interfaces/databasePool";
dotenv.config();

/**
 * Initializes pool object with configuration properties so connection
 * pool may be accessed throughout other modules.
 */

const connectionConfiguration: IConnectionConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_ALIAS,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
}

const dbPool: pg.Pool = new pg.Pool(connectionConfiguration);

export default dbPool;
