import { Sequelize } from "sequelize";
import * as dotenv from "dotenv";
dotenv.config();

const sequelize: Sequelize = new Sequelize(process.env.DB_URI);

try {
    sequelize.authenticate().then(() => {
        console.log("Connection to database successful.");
    });
} catch (exc) {
    console.log(exc);
}

export default sequelize;
