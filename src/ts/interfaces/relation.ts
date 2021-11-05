import { QueryCallback } from "../types/relation";
import { IAuthRequest } from "./authenticatedRequest";

export interface IQueryOptions {
    
}

export interface IRelation {
    save(columns: object, queryOptions?: object | QueryCallback, callback?: QueryCallback): void,
    find(queryFilter: object, queryOptions?: IFindQueryOptions | QueryCallback, callback?: QueryCallback)
}

export interface ISaveQueryOptions {

}

export interface IFindQueryOptions {
    limit?: number | "ALL",
    skip?: number,
    offset?: number,
    includeTotal?: boolean
}

export interface IRelationRequest extends IAuthRequest {
    queryOptions: any
}
