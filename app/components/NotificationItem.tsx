"use client"

import Image from 'next/image'
import { useState } from 'react'
import type { UserMini } from '../types/user'
import {
    FiHeart,
    FiMessageCircle,
    FiUserPlus,
    FiBookmark,
    FiCheck,
    FiTrash2,
    FiSend,
} from 'react-icons/fi'

const NOTIFICATION_STYLES = {
    like: { icon: FiHeart, color: 'text-red-500', bg: 'bg-red-50' },
    comment: { icon: FiMessageCircle, color: 'text-blue-500', bg: 'bg-blue-50' },
    follow: { icon: FiUserPlus, color: 'text-purple-500', bg: 'bg-purple-50' },
    save: { icon: FiBookmark, color: 'text-orange-500', bg: 'bg-orange-50' },
    message: { icon: FiSend, color: 'text-emerald-500', bg: 'bg-emerald-50' },
} as const

export type NotificationType = keyof typeof NOTIFICATION_STYLES

export type NotificationDTO = {
    id: string
    type: NotificationType
    message: string
    isRead: boolean
    createdAt: string
    actor: UserMini
    pinId: string | null
    pinThumbnail: string | null
}

type NotificationItemProps = {
    notification: NotificationDTO
    onMarkAsRead: (id: string) => void
    onDelete: (id: string) => void
}

export default function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: NotificationItemProps) {
    const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

    const timeAgo = (date: string | Date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
        if (seconds < 60) return 'همین حالا'
        if (seconds < 3600) return `${Math.floor(seconds / 60)} دقیقه پیش`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} ساعت پیش`
        return new Date(date).toLocaleDateString('fa-IR')
    }

    const handleConfirmDelete = () => {
        onDelete(notification.id)
        setConfirmingDelete(null)
    }


    const style = NOTIFICATION_STYLES[notification.type as NotificationType]
        ?? NOTIFICATION_STYLES.like
    const Icon = style.icon

    return (
        <div
            className={`flex items-start gap-3 p-4 rounded-2xl transition-all duration-200
                ${!notification.isRead
                    ? 'bg-red-50/60 ring-1 ring-red-100'
                    : 'bg-white ring-1 ring-gray-100'
                }`}
        >
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                {notification.actor.avatar ? (
                    <Image src={notification.actor.avatar} alt={notification.actor.name} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                    notification.actor.username.charAt(0).toUpperCase()
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800">
                    <span className="font-bold">{notification.actor.name}</span>{' '}
                    {notification.message}
                </p>
                <span className="text-[11px] text-gray-400">{timeAgo(notification.createdAt)}</span>
            </div>

            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.bg}`}>
                <Icon className={`w-4 h-4 ${style.color}`} />
            </div>

            {!notification.isRead && (
                <button
                    onClick={() => onMarkAsRead(notification.id)}
                    title="خواندم"
                    className="w-8 h-8 rounded-full bg-gray-50 hover:bg-green-50 flex items-center justify-center text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                >
                    <FiCheck className="w-4 h-4" />
                </button>
            )}
            <button
                onClick={() => setConfirmingDelete(notification.id)}
                title="حذف"
                className="w-8 h-8 rounded-full bg-gray-50 hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
            >
                <FiTrash2 className="w-3.5 h-3.5" />
            </button>

            {confirmingDelete === notification.id && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center">
                        <p className="text-sm text-gray-600 mb-5">این اعلان حذف شود؟</p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 h-11 bg-red-600 text-white rounded-xl font-semibold text-sm cursor-pointer"
                            >
                                حذف
                            </button>
                            <button
                                onClick={() => setConfirmingDelete(null)}
                                className="flex-1 h-11 bg-gray-100 rounded-xl font-semibold text-sm cursor-pointer"
                            >
                                انصراف
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}