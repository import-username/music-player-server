export interface IQueryOptions {
    
}

export interface IRelation {
    save(columns: object, queryOptions?: object, callback?: (err: Error, result: string | object) => void): void
}
