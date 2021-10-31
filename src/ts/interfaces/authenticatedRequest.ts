import * as express from "express";

export interface IAuthRequest extends express.Request {
    user: any
}