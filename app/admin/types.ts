export type Stats = {
    totalUsers: number
    totalPins: number
    pendingPins: number
    totalReports: number
    pendingReports: number
    totalLikes: number
    totalMessages: number
}

export type AdminReport = {
    id: string
    reason: string
    description: string | null
    createdAt: string
    pin: {
        id: string
        title: string
        imageUrl: string
        user: { id: string; username: string; name: string }
    }
    reporter: { id: string; username: string; name: string }
}

export type AdminUserRole = {
    role: {
        id: string
        name: string
        description?: string | null
    }
}

export type AdminUserRow = {
    id: string
    name: string
    username: string
    avatar: string | null
    email: string
    banned: boolean
    createdAt: string
    roles?: AdminUserRole[]
    _count: { pins: number; followers: number }
}

export type CategoryRow = {
    id: string
    slug: string
    name: string
    icon: string
    color: string
    sortOrder: number
    isActive: boolean
    _count: { pins: number }
}

export type RoleItem = {
    id: string
    name: string
    description: string | null
    usersCount: number
    permissions: { key: string; description: string | null }[]
}

export type RolesData = {
    roles: RoleItem[]
    regularUsersCount: number
    totalUsers: number
}

export type AdminPin = {
    id: string
    title: string
    description: string | null
    imageUrl: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    rejectionReason?: string | null
    createdAt: string
    user: {
        id: string
        name: string
        username: string
        avatar: string | null
    }
    category: {
        id: string
        name: string
        slug: string
        color: string
        icon: string
    } | null
    _count: {
        likes: number
        saves: number
        comments: number
        reports: number
    }
}

export type AdminPinsResponse = {
    pins: AdminPin[]
    total: number
    counts?: {
        pending: number
        approved: number
        rejected: number
    }
    page: number
    totalPages: number
}

export type Tab = 'reports' | 'users' | 'roles' | 'pins' | 'categories'
export type UserFilter = 'all' | 'admin' | 'moderator' | 'user' | 'banned'
export type PinStatusFilter = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'
export type ToastState = { message: string; type: 'success' | 'error' } | null

export const REASON_LABELS: Record<string, string> = {
    spam: 'اسپم یا تبلیغات',
    inappropriate: 'محتوای نامناسب',
    violence: 'خشونت یا آزاردهنده',
    hate: 'نفرت‌پراکنی',
    misinformation: 'اطلاعات نادرست',
    other: 'سایر',
}

export function getRoleBadge(user: AdminUserRow) {
    const roleName = user.roles?.[0]?.role?.name || 'user'
    switch (roleName) {
        case 'admin':
            return {
                label: 'مدیر ارشد',
                name: 'admin',
                bg: 'bg-red-50 text-red-700 ring-1 ring-red-200/80',
                dot: 'bg-red-500',
            }
        case 'moderator':
            return {
                label: 'ناظر محتوا',
                name: 'moderator',
                bg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200/80',
                dot: 'bg-blue-500',
            }
        default:
            return {
                label: 'کاربر عادی',
                name: 'user',
                bg: 'bg-gray-100 text-gray-700 ring-1 ring-gray-200/80',
                dot: 'bg-gray-400',
            }
    }
}
