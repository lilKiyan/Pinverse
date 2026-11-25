export type BoardPinPreview = {
    id: string
    title: string
    imageUrl: string
}

export type Board = {
    id: string
    name: string
    isPrivate?: boolean
    createdAt?:string
    pins?:BoardPinPreview[]
}