
export type SavedBoardInfo = {
    boardId: string
    boardName: string | null   
}

export type CategoryInfo = {
    slug: string
    name: string
    icon: string
    color: string
}

export type PinImageDTO = {
    id: string
    imageUrl: string
    width: number | null
    height: number | null
    sortOrder: number
}

export type PinDTO = {
    id: string
    title: string
    description: string | null
    imageUrl: string
    imageWidth: number | null
    imageHeight: number | null
    images?: PinImageDTO[]
    imagesCount?: number
    userId: string
    createdAt: string
    isReportedByMe?: boolean
    updatedAt?: string
    link?: string | null
    isOwner?: boolean
    isSavedByMe?: boolean
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectionReason?: string | null
    category?: CategoryInfo | null 
    savedBoards?: SavedBoardInfo[]
}

export type SharedPinInfo = Pick<PinDTO, 'id' | 'title' | 'imageUrl' | 'imageWidth' | 'imageHeight'>