"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useInfiniteQuery, useMutation, useQueryClient, useQuery, type InfiniteData } from '@tanstack/react-query'
import NotificationItem from '@/app/components/NotificationItem'
import NotificationSkeleton from '@/app/components/skeletons/NotificationSkeleton'
import Spinner from '@/app/components/Spinner'
import AuthGate from '@/app/components/AuthGate'
import { FiBell, FiCheck, FiInbox, FiLogIn } from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'
import type { NotificationDTO } from '@/app/components/NotificationItem'

type UpdatesPage = {
    notifications: NotificationDTO[]
    nextCursor: string | null
}

type NotificationsCache = InfiniteData<UpdatesPage>

export default function UpdatesPage() {
    const queryClient = useQueryClient()
    const user = useAuthStore((state) => state.user)
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    const { data: meData, isLoading: checkingAuth } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me')
            if (!res.ok) return null
            const data = await res.json()
            return data.user
        },
        enabled: !user,
        staleTime: 60 * 1000,
    })

    const currentUser = user || meData

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery<UpdatesPage>({
        queryKey: ['notifications'],
        queryFn: async ({ pageParam }) => {
            const url = pageParam
                ? `/api/notifications?cursor=${pageParam}`
                : '/api/notifications'
            const res = await fetch(url)
            if (!res.ok) throw new Error('خطا در دریافت اعلان‌ها')
            return res.json()
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!currentUser,
        staleTime: 30 * 1000,
    })

    const toggleReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
            if (!res.ok) throw new Error('خطا')
            return res.json() as Promise<{ isRead: boolean; unreadCount: number }>
        },
        onSuccess: (data) => {
            queryClient.setQueryData<{ count: number }>(
                ['notifications-count', user?.id],
                { count: data.unreadCount }
            )
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const markAllMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch('/api/notifications/read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            })
            if (!res.ok) throw new Error('خطا')
            return res.json() as Promise<{ markedCount: number; unreadCount: number }>
        },
        onSuccess: (data) => {
            queryClient.setQueryData<{ count: number }>(
                ['notifications-count', user?.id],
                { count: data.unreadCount }
            )
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        },
    })

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در حذف')
            }
            return id
        },
        onSuccess: (id) => {
            queryClient.setQueryData<NotificationsCache>(['notifications'], (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        notifications: page.notifications.filter((n) => n.id !== id),
                    })),
                }
            })

            queryClient.invalidateQueries({ queryKey: ['notifications-count', user?.id] })
        },
    })

    const notifications = data?.pages.flatMap((p) => p.notifications) ?? []

    const filtered = filter === 'all'
        ? notifications
        : notifications.filter((n) => !n.isRead)

    const unreadCount = notifications.filter((n) => !n.isRead).length

    const handleToggleRead = (notification: NotificationDTO) => {
        const newIsRead = !notification.isRead

        queryClient.setQueryData<NotificationsCache>(['notifications'], (old) => {
            if (!old) return old
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    notifications: page.notifications.map((n) =>
                        n.id === notification.id ? { ...n, isRead: newIsRead } : n
                    ),
                })),
            }
        })

        toggleReadMutation.mutate(notification.id)
    }

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id)
    }

    const handleMarkAllRead = () => {
        queryClient.setQueryData<NotificationsCache>(['notifications'], (old) => {
            if (!old) return old
            return {
                ...old,
                pages: old.pages.map((page) => ({
                    ...page,
                    notifications: page.notifications.map((n) => ({ ...n, isRead: true })),
                })),
            }
        })

        markAllMutation.mutate()
    }

    if (!checkingAuth && !currentUser) {
        return (
            <AuthGate
                icon={FiBell}
                title="اعلان‌های شما"
                description="برای مشاهده تعاملات، لایک‌ها و پیام‌ها وارد شوید."
                redirectUrl="/updates"
            />
        )
    }

    if (isLoading) {
        return <NotificationSkeleton />
    }

    return (
        <main dir="rtl" className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 lg:pb-10">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200 flex items-center justify-center">
                            <FiBell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-extrabold text-gray-900 tracking-tight">
                                اعلان‌ها
                            </h1>
                            {unreadCount > 0 && (
                                <p className="text-xs text-red-500 font-bold mt-0.5">
                                    {unreadCount} اعلان جدید
                                </p>
                            )}
                        </div>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            disabled={markAllMutation.isPending}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white text-gray-600 hover:text-red-600 text-xs font-bold ring-1 ring-gray-200 hover:ring-red-200 shadow-sm hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                        >
                            <FiCheck className="w-4 h-4" />
                            خواندن همه
                        </button>
                    )}
                </div>

                <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === 'all'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        همه ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${filter === 'unread'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        نخوانده ({unreadCount})
                    </button>
                </div>

                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-100 flex items-center justify-center rotate-3 mb-4">
                            <FiInbox className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-bold">
                            {filter === 'unread' ? 'همه را خوانده‌ای!' : 'هنوز اعلانی نداری'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            وقتی کسی با پین‌ها و پروفایلت تعامل کند، اینجا خبرش را می‌بینی
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {filtered.map((notification, index) => (
                            <div
                                key={notification.id}
                                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                                className="animate-[commentIn_0.3s_ease-out_backwards]"
                            >
                                <NotificationItem
                                    notification={notification}
                                    onMarkAsRead={() => handleToggleRead(notification)}
                                    onDelete={handleDelete}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {hasNextPage && filtered.length > 0 && (
                    <div className="flex justify-center mt-6">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="px-5 py-2 rounded-full bg-white text-gray-600 text-xs font-bold ring-1 ring-gray-200 hover:ring-red-200 hover:text-red-600 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                        >
                            {isFetchingNextPage ? <Spinner size="xs" /> : 'بارگذاری بیشتر'}
                        </button>
                    </div>
                )}
            </div>
        </main>
    )
}