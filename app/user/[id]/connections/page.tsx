"use client"

import { useState, useMemo, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
    useInfiniteQuery,
    useMutation,
    useQueryClient,
    type InfiniteData,
} from '@tanstack/react-query'
import {
    FiArrowRight,
    FiSearch,
    FiUserPlus,
    FiUserCheck,
    FiUserX,
    FiCheck,
    FiUsers,
    FiAtSign,
    FiRotateCcw,
    FiX,
    FiRefreshCw,
    FiAlertCircle,
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'


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


export default function ConnectionsPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ConnectionsContent />
        </Suspense>
    )
}


function ConnectionsContent() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user } = useAuthStore()
    const searchParams = useSearchParams()

    const initialTab: Tab =
        searchParams.get('tab') === 'following' ? 'following' : 'followers'

    const [tab, setTab] = useState<Tab>(initialTab)
    const [search, setSearch] = useState('')
    const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set())
    const loadMoreRef = useRef<HTMLDivElement | null>(null)

    const [undoTarget, setUndoTarget] = useState<{ id: string; name: string } | null>(null)
    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        refetch,
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

    useEffect(() => {
        const el = loadMoreRef.current
        if (!el || !hasNextPage) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage()
                }
            },
            { rootMargin: '300px' }
        )

        observer.observe(el)
        return () => observer.disconnect()
    }, [hasNextPage, isFetchingNextPage, fetchNextPage])

    const owner = data?.pages[0]?.owner ?? null
    const users = useMemo(
        () => data?.pages.flatMap((p) => p.users) ?? [],
        [data]
    )

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return users
        return users.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q)
        )
    }, [users, search])

    const followMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در تغییر وضعیت دنبال کردن')
            return res.json() as Promise<{ isFollowing: boolean; followersCount: number }>
        },
        onMutate: async (targetId) => {
            setPendingIds((prev) => new Set(prev).add(targetId))
            await queryClient.cancelQueries({ queryKey: ['connections', id, tab] })

            const previousData = queryClient.getQueryData<ConnectionsCache>([
                'connections',
                id,
                tab,
            ])

            queryClient.setQueryData<ConnectionsCache>(
                ['connections', id, tab],
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            users: page.users.map((u) =>
                                u.id === targetId
                                    ? { ...u, isFollowing: !u.isFollowing }
                                    : u
                            ),
                        })),
                    }
                }
            )

            return { previousData }
        },
        onSuccess: (resData, targetId) => {
            queryClient.setQueryData<ConnectionsCache>(
                ['connections', id, tab],
                (old) => {
                    if (!old) return old
                    return {
                        ...old,
                        pages: old.pages.map((page) => ({
                            ...page,
                            users: page.users.map((u) =>
                                u.id === targetId
                                    ? { ...u, isFollowing: resData.isFollowing }
                                    : u
                            ),
                        })),
                    }
                }
            )
            queryClient.invalidateQueries({ queryKey: ['user', id] })
            queryClient.invalidateQueries({ queryKey: ['follow-stats'] })
        },
        onError: (_err, _targetId, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(
                    ['connections', id, tab],
                    context.previousData
                )
            }
        },
        onSettled: (_data, _err, targetId) => {
            setPendingIds((prev) => {
                const next = new Set(prev)
                next.delete(targetId)
                return next
            })
        },
    })

    useEffect(() => {
        return () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        }
    }, [])

    const handleFollow = (target: ConnectionUser) => {
        if (!user) {
            router.push('/login')
            return
        }
        if (pendingIds.has(target.id)) return

        if (target.isFollowing) {
            setUndoTarget({ id: target.id, name: target.name })
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
            undoTimerRef.current = setTimeout(() => setUndoTarget(null), 4000)
        } else if (undoTarget?.id === target.id) {
            setUndoTarget(null)
        }

        followMutation.mutate(target.id)
    }

    const handleUndoUnfollow = () => {
        if (!undoTarget || pendingIds.has(undoTarget.id)) return
        const targetId = undoTarget.id
        setUndoTarget(null)
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        followMutation.mutate(targetId)
    }

    const handleTabChange = (nextTab: Tab) => {
        if (nextTab === tab) return
        setTab(nextTab)
        setSearch('')
    }

    return (
        <div
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-[#FAFAFB] px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-12"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-44 -left-24 h-72 w-72 rounded-full bg-indigo-200/25 blur-3xl"
            />

            <div className="relative mx-auto max-w-5xl">
                <header className="mb-6 flex items-center justify-between gap-3 animate-[fadeInUp_0.35s_ease-out_both]">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="بازگشت"
                            className="group flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl
                                bg-white text-gray-500 ring-1 ring-gray-200/90 shadow-sm
                                hover:bg-gray-900 hover:text-white hover:ring-gray-900
                                transition-all duration-200 active:scale-95 cursor-pointer"
                        >
                            <FiArrowRight className="h-4 w-4" />
                        </button>

                        {isLoading && !owner ? (
                            <OwnerHeaderSkeleton />
                        ) : (
                            <div className="flex items-center gap-3 min-w-0">
                                {owner && (
                                    <Link
                                        href={`/user/${owner.id}`}
                                        className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 overflow-hidden rounded-2xl
                                            bg-gradient-to-br from-red-500 to-rose-600
                                            flex items-center justify-center text-sm font-black text-white
                                            ring-2 ring-white shadow-sm hover:scale-105 transition-transform no-underline"
                                    >
                                        {owner.avatar ? (
                                            <Image
                                                src={owner.avatar}
                                                alt={owner.name}
                                                width={44}
                                                height={44}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            owner.username?.charAt(0).toUpperCase()
                                        )}
                                    </Link>
                                )}

                                <div className="min-w-0">
                                    <h1 className="truncate text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
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
                                            dir="ltr"
                                            className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs font-medium text-gray-400 hover:text-red-600 transition-colors no-underline"
                                        >
                                            <FiAtSign className="h-3 w-3 shrink-0" />
                                            <span className="truncate">{owner.username}</span>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {!isLoading && users.length > 0 && (
                        <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200/80 tabular-nums">
                            <FiUsers className="h-3.5 w-3.5 text-red-500" />
                            {filteredUsers.length.toLocaleString('fa-IR')}
                            {hasNextPage && !search.trim() ? '+' : ''} کاربر
                        </span>
                    )}
                </header>

                <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-md p-2.5 sm:p-3 ring-1 ring-gray-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-2.5 animate-[fadeInUp_0.35s_ease-out_50ms_backwards]">
                    <div className="grid grid-cols-2 md:flex items-center gap-1 rounded-xl bg-gray-100/90 p-1 shrink-0">
                        <button
                            type="button"
                            onClick={() => handleTabChange('followers')}
                            className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${tab === 'followers'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <FiUsers className="h-3.5 w-3.5" />
                            دنبال‌کننده‌ها
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('following')}
                            className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer ${tab === 'following'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <FiUserCheck className="h-3.5 w-3.5" />
                            دنبال‌شده‌ها
                        </button>
                    </div>

                    <div className="relative flex-1 group">
                        <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو بر اساس نام یا نام کاربری..."
                            className="w-full rounded-xl bg-gray-50/90 pr-10 pl-9 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400
                                ring-1 ring-gray-200/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="پاک کردن جستجو"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300 hover:text-gray-800 transition-colors cursor-pointer"
                            >
                                <FiX className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {isLoading ? (
                    <ConnectionsGridSkeleton count={9} />
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-16 px-6 text-center ring-1 ring-gray-200/80 shadow-sm">
                        <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <FiAlertCircle className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-bold text-gray-900">
                            خطا در دریافت لیست کاربران
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 px-4 py-2 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer"
                        >
                            <FiRefreshCw className="h-3.5 w-3.5" />
                            تلاش مجدد
                        </button>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-16 sm:py-20 px-6 text-center ring-1 ring-gray-200/80 shadow-sm">
                        <div className="mb-3.5 flex h-13 w-13 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                            {search ? (
                                <FiSearch className="h-5 w-5" />
                            ) : (
                                <FiUsers className="h-5 w-5" />
                            )}
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                            {search
                                ? 'کاربری با این مشخصات پیدا نشد'
                                : tab === 'followers'
                                    ? 'هنوز دنبال‌کننده‌ای وجود ندارد'
                                    : 'هنوز کسی دنبال نشده است'}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 max-w-xs">
                            {search
                                ? `نتیجه‌ای برای «${search.trim()}» در این لیست یافت نشد.`
                                : tab === 'followers'
                                    ? 'وقتی کاربران دیگر این پروفایل را دنبال کنند، اینجا نمایش داده می‌شوند.'
                                    : 'پروفایل‌هایی که دنبال شوند در این بخش لیست می‌شوند.'}
                        </p>
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                            >
                                نمایش همه کاربران
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {filteredUsers.map((u, index) => {
                                const isMe = user?.id === u.id
                                const isLoadingRow = pendingIds.has(u.id)

                                return (
                                    <div
                                        key={u.id}
                                        style={{
                                            animationDelay: `${Math.min(index * 25, 250)}ms`,
                                        }}
                                        className="group/card relative flex items-center gap-3.5 rounded-2xl bg-white p-4
                                            ring-1 ring-gray-200/75 shadow-sm
                                            hover:ring-gray-300 hover:-translate-y-0.5 hover:shadow-md
                                            transition-all duration-200
                                            animate-[fadeInUp_0.3s_ease-out_backwards]"
                                    >
                                        <Link
                                            href={`/user/${u.id}`}
                                            className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl
                                                bg-gradient-to-br from-red-500 via-rose-500 to-orange-400
                                                flex items-center justify-center text-base font-black text-white
                                                ring-2 ring-gray-100 group-hover/card:ring-rose-200
                                                transition-all duration-200 group-hover/card:scale-105 no-underline"
                                        >
                                            {u.avatar ? (
                                                <Image
                                                    src={u.avatar}
                                                    alt={u.name}
                                                    width={48}
                                                    height={48}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                u.username?.charAt(0).toUpperCase()
                                            )}
                                        </Link>

                                        <Link
                                            href={`/user/${u.id}`}
                                            className="min-w-0 flex-1 no-underline"
                                        >
                                            <p className="truncate text-sm font-bold text-gray-900 group-hover/card:text-red-600 transition-colors">
                                                {u.name}
                                            </p>
                                            <p
                                                dir="ltr"
                                                className="mt-0.5 inline-flex max-w-full items-center text-xs text-gray-400 truncate"
                                            >
                                                @{u.username}
                                            </p>
                                        </Link>

                                        {isMe ? (
                                            <span className="shrink-0 rounded-xl bg-gray-100 px-3 py-1.5 text-[11px] font-bold text-gray-500">
                                                شما
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleFollow(u)}
                                                disabled={isLoadingRow}
                                                className={`shrink-0 w-[104px] inline-flex items-center justify-center gap-1.5 rounded-xl
        py-2 text-xs font-bold transition-all duration-200
        cursor-pointer active:scale-95 disabled:opacity-55 ${u.isFollowing
                                                        ? 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-200/80 hover:bg-gray-200/80 hover:text-gray-900'
                                                        : 'bg-gray-900 text-white shadow-sm hover:bg-red-600'
                                                    }`}
                                            >
                                                {isLoadingRow ? (
                                                    <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : u.isFollowing ? (
                                                    <>
                                                        <FiCheck className="h-3.5 w-3.5 text-gray-500" />
                                                        <span>دنبال شده</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiUserPlus className="h-3.5 w-3.5" />
                                                        <span>دنبال کردن</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {hasNextPage && (
                            <div ref={loadMoreRef} className="mt-3.5">
                                {isFetchingNextPage && (
                                    <ConnectionsGridSkeleton count={3} />
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {undoTarget && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-[fadeInUp_0.2s_ease-out]">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-xl ring-1 ring-white/10">
                        <span className="truncate text-xs font-medium text-gray-200">
                            دنبال کردن <strong className="font-bold text-white">{undoTarget.name}</strong> لغو شد
                        </span>
                        <button
                            type="button"
                            onClick={handleUndoUnfollow}
                            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-white/15 hover:bg-white/25 px-2.5 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer active:scale-95"
                        >
                            <FiRotateCcw className="h-3 w-3" />
                            بازگردانی
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; transition-duration: 0.01ms !important; }
                }
            `}</style>
        </div>
    )
}


function OwnerHeaderSkeleton() {
    return (
        <div className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl bg-gray-200/80 shrink-0" />
            <div className="space-y-2">
                <div className="h-4 w-36 sm:w-44 rounded-lg bg-gray-200/80" />
                <div className="h-3 w-20 rounded-md bg-gray-200/60" />
            </div>
        </div>
    )
}

function ConnectionsGridSkeleton({ count = 9 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-2xl bg-white p-4 ring-1 ring-gray-200/70 animate-pulse"
                >
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-gray-100" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <div className="h-3.5 w-28 rounded-md bg-gray-100" />
                        <div className="h-3 w-20 rounded-md bg-gray-100/80" />
                    </div>
                    <div className="h-8 w-20 shrink-0 rounded-xl bg-gray-100" />
                </div>
            ))}
        </div>
    )
}

function PageSkeleton() {
    return (
        <div dir="rtl" className="min-h-screen bg-[#FAFAFB] px-4 sm:px-6 py-6 sm:py-8">
            <div className="mx-auto max-w-5xl">
                <div className="mb-6 flex items-center gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-xl bg-gray-200/80" />
                    <OwnerHeaderSkeleton />
                </div>
                <div className="mb-6 h-14 rounded-2xl bg-white ring-1 ring-gray-200/70 animate-pulse" />
                <ConnectionsGridSkeleton count={9} />
            </div>
        </div>
    )
}