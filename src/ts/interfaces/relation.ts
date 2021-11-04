import { QueryCallback } from "../types/relation";

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
    offset?: number
}
