import * as pg from "pg";
import { IUserQuery } from "../interfaces/users";

export type UsersQueryCallback = (err: Error, query: IUserQuery) => void