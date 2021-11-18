import { IAuthRequest } from "./authenticatedRequest";

export interface ISaveQuery {
    id: string,
    user_id: string,
    song_file_path: string,
    song_thumbnail_path: string,
    song_title: string,
    song_description: string,
    song_author: string,
    song_favorite: "TRUE" | "FALSE",
    song_playlists: string
}

export interface ISaveQueryOptionals {
    thumbnailPath?: string,
    description?: string,
    author?: string,
    favorite?: boolean | "TRUE" | "FALSE",
    playlists?: Array<String>
}

export interface ISongData {
    id?: string,
    user_id?: string,
    song_file_path?: string,
    song_thumbnail_path?: string,
    song_title?: string,
    song_description?: string,
    song_author?: string,
    song_favorite?: "TRUE" | "FALSE",
    song_playlists?: string
}

export interface IUploadSongRequest extends IAuthRequest {
    songData?: ISongData
}

export interface IUploadFileError {
    err: Error,
    statusCode: number
}
