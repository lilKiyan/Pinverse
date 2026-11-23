"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PinCard from '../components/PinCard'
import UserCard, { type SearchUser } from '../components/UserCard'
import { useAuthStore } from '@/lib/authStore'
import { FiSearch, FiX, FiUsers, FiGrid } from 'react-icons/fi'
import Spinner from '@/app/components/Spinner'

type Tab = 'pins' | 'users'

const SkeletonPinCard = ({ tall }: { tall: boolean }) => (
    <div className="break-inside-avoid mb-4 animate-pulse">
        <div className={`rounded-[15px] bg-gray-200/70 ${tall ? 'h-72' : 'h-48'}`} />
        <div className="mt-2.5 px-1 flex items-center gap-2">
            <div className="h-3 w-20 rounded-full bg-gray-200/70" />
            <div className="mr-auto h-3 w-10 rounded-full bg-gray-200/70" />
        </div>
    </div>
)

const SkeletonUserCard = () => (
    <div className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl ring-1 ring-gray-100 animate-pulse">
        <div className="w-14 h-14 rounded-full bg-gray-200/70 shrink-0" />
        <div className="flex-1 space-y-2.5">
            <div className="h-3.5 w-28 rounded-full bg-gray-200/70" />
            <div className="h-3 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="h-8 w-24 rounded-full bg-gray-200/70 shrink-0" />
    </div>
)

function SearchContent() {
    const searchParams = useSearchParams()
    const q = searchParams.get('q') || ''
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const [activeTab, setActiveTab] = useState<Tab>('pins')

    const hasQuery = q.trim().length > 0

    const {
        data: pins = [],
        isLoading: loadingPins,
        isError: isPinsError,
    } = useQuery<any[]>({
        queryKey: ['search', 'pins', q],
        queryFn: async () => {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
            if (!res.ok) throw new Error('خطا در جستجوی پین‌ها')
            const data = await res.json()
            return data.pins || []
        },
        enabled: hasQuery,
        staleTime: 2 * 60 * 1000,
    })

    const {
        data: users = [],
        isLoading: loadingUsers,
        isError: isUsersError,
    } = useQuery<SearchUser[]>({
        queryKey: ['search', 'users', q, user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`)
            if (!res.ok) throw new Error('خطا در جستجوی کاربران')
            const data = await res.json()
            return data.users || []
        },
        enabled: hasQuery,
        staleTime: 2 * 60 * 1000,
    })

    const followMutation = useMutation({
        mutationFn: async (userId: string) => {
            const res = await fetch(`/api/users/${userId}/follow`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در فالو')
            return res.json() as Promise<{ isFollowing: boolean; followersCount: number }>
        },
        onMutate: async (userId) => {
            await queryClient.cancelQueries({ queryKey: ['search', 'users', q, user?.id] })
            const previous = queryClient.getQueryData<SearchUser[]>(['search', 'users', q, user?.id])

            queryClient.setQueryData<SearchUser[]>(['search', 'users', q, user?.id], (old) => {
                if (!old) return old
                return old.map((u) => {
                    if (u.id !== userId) return u
                    const wasFollowing = u.isFollowing
                    return {
                        ...u,
                        isFollowing: !wasFollowing,
                        followersCount: wasFollowing ? u.followersCount - 1 : u.followersCount + 1,
                    }
                })
            })

            return { previous }
        },
        onError: (_err, _vars, context) => {
            if (context?.previous) {
                queryClient.setQueryData(['search', 'users', q, user?.id], context.previous)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['search', 'users'] })
        },
    })

    const handleToggleFollow = (targetUser: SearchUser) => {
        if (!user) return
        followMutation.mutate(targetUser.id)
    }

    useEffect(() => {
        console.log('q:', q)
        console.log('activeTab:', activeTab)
    }, [q, activeTab])

    useEffect(() => {
        console.log('users data:', users)
        console.log('loadingUsers:', loadingUsers)
        console.log('isUsersError:', isUsersError)
    }, [users, loadingUsers, isUsersError])

    const currentLoading = activeTab === 'pins' ? loadingPins : loadingUsers
    const currentError = activeTab === 'pins' ? isPinsError : isUsersError
    const currentItems = activeTab === 'pins' ? pins : users

    return (
        <main
            dir="rtl"
            className="relative min-h-screen mb-12 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 py-8 px-4"
        >
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative mx-auto px-3 max-w-6xl">
                <div className="mb-8">
                    <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                        <FiSearch className="w-3.5 h-3.5" />
                        نتایج جستجو
                    </p>

                    {q ? (
                        <div className="flex items-center gap-3 flex-wrap">
                            <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl pr-4 pl-2 py-2 shadow-lg shadow-gray-200/60 ring-1 ring-black/5 max-w-full">
                                <FiSearch className="w-5 h-5 text-red-500 shrink-0" />
                                <span className="font-extrabold text-gray-900 text-base truncate">
                                    {q}
                                </span>
                                <Link
                                    href="/"
                                    className="shrink-0 w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 text-gray-400 flex items-center justify-center transition-all hover:rotate-90 duration-300 cursor-pointer no-underline"
                                    title="پاک کردن جستجو"
                                >
                                    <FiX className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <h1 className="text-xl md:text-3xl font-extrabold text-gray-900">
                            جستجو کنید
                        </h1>
                    )}
                </div>

                {hasQuery && (
                    <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full p-1 mb-8">
                        <button
                            onClick={() => {
                                setActiveTab('pins')
                            }}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2 font-semibold text-sm rounded-full transition-all cursor-pointer ${activeTab === 'pins'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <FiGrid className="w-4 h-4" />
                            <span>پین‌ها</span>
                            {!loadingPins && pins.length > 0 && (
                                <span className="text-[10px] font-extrabold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full tabular-nums">
                                    {pins.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => {
                                console.log('👆 CLICKED: users')
                                setActiveTab('users')
                            }}
                            className={`flex items-center gap-2 px-4 sm:px-5 py-2 font-semibold text-sm rounded-full transition-all cursor-pointer ${activeTab === 'users'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-800'
                                }`}
                        >
                            <FiUsers className="w-4 h-4" />
                            <span>کاربران</span>
                            {!loadingUsers && users.length > 0 && (
                                <span className="text-[10px] font-extrabold bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full tabular-nums">
                                    {users.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {!hasQuery ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center mb-4 rotate-3">
                            <FiSearch className="w-9 h-9 text-gray-300" />
                        </div>
                        <p className="text-gray-500 text-sm">
                            یه عبارت توی نوار جستجوی بالا بنویس تا شروع کنیم
                        </p>
                    </div>
                ) : currentLoading ? (
                    activeTab === 'pins' ? (
                        <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                            <SkeletonPinCard tall={true} />
                            <SkeletonPinCard tall={false} />
                            <SkeletonPinCard tall={true} />
                            <SkeletonPinCard tall={false} />
                            <SkeletonPinCard tall={true} />
                            <SkeletonPinCard tall={false} />
                            <SkeletonPinCard tall={false} />
                            <SkeletonPinCard tall={true} />
                            <SkeletonPinCard tall={false} />
                            <SkeletonPinCard tall={true} />
                        </div>
                    ) : (
                        <div className="space-y-3 max-w-3xl mx-auto">
                            <SkeletonUserCard />
                            <SkeletonUserCard />
                            <SkeletonUserCard />
                            <SkeletonUserCard />
                            <SkeletonUserCard />
                        </div>
                    )
                ) : currentError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 rounded-3xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center mb-4 rotate-3">
                            <FiX className="w-9 h-9 text-red-400" />
                        </div>
                        <h2 className="text-lg font-extrabold text-gray-800 mb-1">خطایی رخ داد</h2>
                        <p className="text-gray-500 text-sm">لطفاً دوباره تلاش کنید</p>
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 md:py-28 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-100/60 rounded-full blur-2xl scale-125 pointer-events-none" />
                            <div className="relative w-24 h-24 rounded-[1.75rem] bg-white shadow-xl shadow-gray-200/60 ring-1 ring-black/5 flex items-center justify-center rotate-3">
                                {activeTab === 'pins' ? (
                                    <FiSearch className="w-10 h-10 text-gray-300" />
                                ) : (
                                    <FiUsers className="w-10 h-10 text-gray-300" />
                                )}
                                <span className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/70 flex items-center justify-center -rotate-6">
                                    <FiX className="w-5 h-5 text-white" />
                                </span>
                            </div>
                        </div>

                        <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-2">
                            {activeTab === 'pins' ? 'پینی پیدا نشد' : 'کاربری پیدا نشد'}
                        </h2>
                        <p className="text-gray-500 text-sm md:text-base leading-relaxed max-w-sm">
                            نتیجه‌ای برای{' '}
                            <span className="font-bold text-gray-700">«{q}»</span> پیدا نشد.
                            <br />
                            املای عبارت را بررسی کنید یا عبارت دیگری را امتحان کنید.
                        </p>
                    </div>
                ) : activeTab === 'pins' ? (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {pins.map((pin) => (
                            <PinCard key={pin.id} pin={pin} />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-3 max-w-6xl mx-auto">
                        {users.map((u) => (
                            <UserCard
                                key={u.id}
                                user={u}
                                currentUserId={user?.id}
                                onToggleFollow={handleToggleFollow}
                                isFollowPending={followMutation.isPending && followMutation.variables === u.id}
                            />
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </main>
    )
}

export default function SearchPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/40">
<Spinner size="md" />
                </main>
            }
        >
            <SearchContent />
        </Suspense>
    )
}