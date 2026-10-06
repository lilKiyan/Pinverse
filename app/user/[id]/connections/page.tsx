"use client"

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import Spinner from '@/app/components/Spinner'
import { FiArrowRight, FiSearch, FiUserPlus, FiCheck, FiUsers, FiAtSign } from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'

// ═══════════ تایپ‌ها ═══════════

type ConnectionUser = {
    id: string
    name: string
    username: string
    avatar: string | null
    isFollowing: boolean
}

type ConnectionsPage = {
    users: ConnectionUser[]
    nextCursor: string | null
    owner: {
        id: string
        name: string
        username: string
        avatar: string | null
    }
}

type Tab = 'followers' | 'following'

type ConnectionsCache = InfiniteData<ConnectionsPage>

// ═══════════ wrapper با Suspense ═══════════

export default function ConnectionsPage() {
    return (
        <Suspense
            fallback={
                <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
                    <Spinner size="lg" />
                </div>
            }
        >
            <ConnectionsContent />
        </Suspense>
    )
}

// ═══════════ بدنه ═══════════

function ConnectionsContent() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') === 'following' ? 'following' : 'followers'
    const [tab, setTab] = useState<Tab>(initialTab)
    const [search, setSearch] = useState('')

    // ── Query: لیست + صاحب لیست ──
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery<ConnectionsPage>({
        queryKey: ['connections', id, tab],
        queryFn: async ({ pageParam }) => {
            const url = new URL(`/api/users/${id}/connections`, window.location.origin)
            url.searchParams.set('type', tab)
            if (pageParam) url.searchParams.set('cursor', String(pageParam))

            const res = await fetch(url.toString())
            if (!res.ok) throw new Error('خطا در دریافت لیست')
            return res.json()
        },
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 30 * 1000,
        enabled: !!id,
    })

    const owner = data?.pages[0]?.owner ?? null
    const users = data?.pages.flatMap((p) => p.users) ?? []

    // ── جستجوی زنده ──
    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return users
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q)
        )
    }, [users, search])

    // ── Mutation: فالو/آنفالو ──
    const followMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در فالو')
            return res.json() as Promise<{ isFollowing: boolean; followersCount: number }>
        },
        onSuccess: (data, userId) => {
            queryClient.setQueryData<ConnectionsCache>(
                ['connections', id, tab],
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            users: page.users.map((u) =>
                                u.id === userId ? { ...u, isFollowing: data.isFollowing } : u
                            ),
                        })),
                    }
                }
            )
            queryClient.invalidateQueries({ queryKey: ['user', id] })
        },
        onError: (err: Error) => {
            console.error(err.message)
        },
    })


    const handleFollow = (targetId: string, currentIsFollowing: boolean) => {
        if (!user) {
            router.push('/login')
            return
        }
        // Optimistic
        queryClient.setQueryData<ConnectionsCache>(
            ['connections', id, tab],
            (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        users: page.users.map((u) =>
                            u.id === targetId ? { ...u, isFollowing: !currentIsFollowing } : u
                        ),
                    })),
                }
            }
        )
        followMutation.mutate(targetId)
    }

    return (
        <div dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-white px-4 sm:px-6 py-6 sm:py-10">
            <div className="max-w-6xl mx-auto">

                {/* ═══ هدر — بازگشت + هویت صاحب لیست ═══ */}
                <div className="flex items-center gap-3.5 mb-8 animate-[fadeInUp_0.4s_ease-out_both]">
                    <button
                        onClick={() => router.back()}
                        aria-label="بازگشت"
                        className="group w-10 h-10 shrink-0 rounded-full
                            flex items-center justify-center
                            text-gray-400 hover:text-white
                            ring-1 ring-gray-200 hover:ring-gray-900
                            bg-white hover:bg-gray-900
                            transition-all duration-300
                            hover:shadow-lg hover:shadow-gray-900/20
                            active:scale-90 cursor-pointer"
                    >
                        <FiArrowRight className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                    </button>

                    {/* آواتار صاحب لیست — کلیک → پروفایلش */}
                    {owner && (
                        <Link
                            href={`/user/${owner.id}`}
                            className="relative w-11 h-11 rounded-full overflow-hidden shrink-0
                                bg-gradient-to-br from-red-500 to-orange-500
                                flex items-center justify-center
                                text-white font-bold ring-2 ring-white shadow-md
                                no-underline"
                        >
                            {owner.avatar ? (
                                <Image
                                    src={owner.avatar}
                                    alt={owner.name}
                                    width={44}
                                    height={44}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                owner.username?.charAt(0).toUpperCase()
                            )}
                        </Link>
                    )}

                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">
                            {tab === 'followers' && owner
                                ? `دنبال‌کننده‌های ${owner.name}`
                                : tab === 'following' && owner
                                    ? `دنبال‌شده‌های ${owner.name}`
                                    : tab === 'followers'
                                        ? 'دنبال‌کننده‌ها'
                                        : 'دنبال‌شده‌ها'}
                        </h1>
                        {owner && (
                            <Link
                                href={`/user/${owner.id}`}
                                className="no-underline text-[13px] text-gray-400
                                    hover:text-red-600 transition-colors inline-flex items-center gap-1"
                            >
                                <FiAtSign className="w-3 h-3" />
                                {owner.username}
                            </Link>
                        )}
                    </div>
                </div>

                {/* ═══ تب‌ها ═══ */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1 mb-4 animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
                    <button
                        onClick={() => setTab('followers')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full
                            text-xs font-bold transition-all cursor-pointer ${tab === 'followers'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        <FiUsers className="w-3.5 h-3.5" />
                        دنبال‌کننده‌ها
                    </button>
                    <button
                        onClick={() => setTab('following')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full
                            text-xs font-bold transition-all cursor-pointer ${tab === 'following'
                                ? 'bg-white shadow-sm text-gray-900'
                                : 'text-gray-500 hover:text-gray-800'
                            }`}
                    >
                        دنبال‌شده‌ها
                    </button>
                </div>

                {/* ═══ جستجو ═══ */}
                <div className="relative mb-4 animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
                    <FiSearch className="absolute right-4 top-1/2 -translate-y-1/2
                        text-gray-300 w-4 h-4 pointer-events-none" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در لیست..."
                        className="w-full bg-white ring-1 ring-gray-200/80 rounded-full
                            pr-11 pl-4 py-3 text-sm text-gray-800 placeholder-gray-300
                            focus:outline-none focus:ring-2 focus:ring-red-300/60
                            transition-all"
                    />
                </div>

                {/* ═══ لیست ═══ */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <Spinner size="lg" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-20 text-center">
                        <FiUsers className="w-7 h-7 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm text-gray-400">
                            {search
                                ? 'کاربری با این مشخصات پیدا نشد'
                                : tab === 'followers'
                                    ? 'هنوز کسی این کاربر را دنبال نکرده'
                                    : 'این کاربر هنوز کسی را دنبال نکرده'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredUsers.map((u, index) => {
                            const isMe = user?.id === u.id
                            const isLoadingRow = followMutation.isPending && followMutation.variables === u.id

                            return (
                                <div
                                    key={u.id}
                                    style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                                    className="group/row py-3.5 px-3 -mx-3 flex items-center gap-3.5
                                        rounded-2xl transition-colors duration-200
                                        hover:bg-gray-50/80
                                        animate-[fadeInUp_0.3s_ease-out_backwards]"
                                >
                                    {/* آواتار — حلقه‌ای که hover رنگ می‌گیرد */}
                                    <Link
                                        href={`/user/${u.id}`}
                                        className="relative w-12 h-12 rounded-full overflow-hidden shrink-0
                                            bg-gradient-to-br from-red-500 to-orange-500
                                            flex items-center justify-center
                                            text-white font-bold
                                            ring-2 ring-white shadow-md
                                            transition-all duration-300
                                            group-hover/row:ring-red-200 group-hover/row:scale-105
                                            no-underline"
                                    >
                                        {u.avatar ? (
                                            <Image
                                                src={u.avatar}
                                                alt={u.name}
                                                width={48}
                                                height={48}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            u.username?.charAt(0).toUpperCase()
                                        )}
                                    </Link>

                                    {/* اطلاعات */}
                                    <Link
                                        href={`/user/${u.id}`}
                                        className="flex-1 min-w-0 no-underline group/name"
                                    >
                                        <p className="font-bold text-sm text-gray-900 truncate
                                            group-hover/name:text-red-600 transition-colors duration-200">
                                            {u.name}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate group-hover/name:text-gray-500 transition-colors duration-200">
                                            @{u.username}
                                        </p>
                                    </Link>

                                    {/* دکمه فالو */}
                                    {!isMe && (
                                        <button
                                            onClick={() => handleFollow(u.id, u.isFollowing)}
                                            disabled={isLoadingRow}
                                            className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full
                                                text-xs font-bold
                                                transition-all duration-300 cursor-pointer
                                                active:scale-90 disabled:opacity-50
                                                ${u.isFollowing
                                                    ? 'bg-white text-gray-600 ring-1 ring-gray-200 hover:ring-red-300 hover:bg-red-50 hover:text-red-600'
                                                    : 'bg-gray-900 text-white shadow-md hover:bg-black hover:shadow-lg hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {isLoadingRow ? (
                                                <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : u.isFollowing ? (
                                                <>
                                                    <FiCheck className="w-3.5 h-3.5 text-green-600" />
                                                    <span className="hidden sm:inline">دنبال شده</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiUserPlus className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">دنبال کردن</span>
                                                    <span className="sm:hidden font-bold">+</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ═══ بارگذاری بیشتر ═══ */}
                {hasNextPage && (
                    <div className="flex justify-center py-8">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="no-underline px-6 py-2.5 rounded-full bg-gray-900 text-white
                                text-xs font-bold hover:bg-gray-800 transition-all
                                cursor-pointer disabled:opacity-50"
                        >
                            {isFetchingNextPage ? (
                                <Spinner size="xs" />
                            ) : (
                                'بارگذاری بیشتر'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}