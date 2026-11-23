import { User } from '@prisma/client'



export type CurrentUser = Pick<User, 'id' | 'email' | 'username' | 'name'> & {
    avatar: string | null
    bio: string | null
    unreadNotifications: number  
}

export type UserMini = Pick<CurrentUser, 'id' | 'name' | 'username' | 'avatar'>