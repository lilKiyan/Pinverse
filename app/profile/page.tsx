"use client"

import { useEffect } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import PinCard from '../components/PinCard'
import PinGridSkeleton from '../components/skeletons/PinGridSkeleton'
import UserProfileSkeleton from '../components/skeletons/UserProfileSkeleton'
import AuthGate from '../components/AuthGate'
import { useAuthStore } from '@/lib/authStore'
import { FiAtSign, FiMail, FiUsers, FiImage, FiMapPin, FiGrid, FiPlus, FiUserPlus, FiLogIn, FiUser } from 'react-icons/fi'

export default function ProfilePage() {
    const { user, setUser } = useAuthStore()
    const queryClient = useQueryClient()

    const { data: followData } = useQuery<{ followersCount: number; followingCount: number }>({
        queryKey: ['follow-stats', user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/users/${user!.id}/follow`)
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        enabled: !!user?.id,
        staleTime: 60 * 1000,
    })

    const followingCount = followData?.followingCount ?? 0

    const { data: meUser, isLoading: loadingUser } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me')
            if (!res.ok) return null
            const data = await res.json()
            return data.user
        },
        enabled: !user,           
        staleTime: 5 * 60 * 1000,
    })

    const currentUser = user || meUser

    useEffect(() => {
        if (!user && meUser) {
            setUser(meUser)
        }
    }, [user, meUser, setUser])

    const {
        data: pins = [],
        isLoading: loadingPins,
    } = useQuery({
        queryKey: ['my-pins'],
        queryFn: async () => {
            const res = await fetch('/api/pins/mine')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های من')
            return res.json()
        },
        enabled: !!user,
        staleTime: 60 * 1000,
    })

    const { data: followersCount = 0 } = useQuery({
        queryKey: ['followers-count', user?.id],
        queryFn: async () => {
            const res = await fetch(`/api/users/${user!.id}/follow`)
            if (!res.ok) throw new Error('خطا در دریافت دنبال‌کننده‌ها')
            const data = await res.json()
            return data.followersCount
        },
        enabled: !!user?.id,
        staleTime: 60 * 1000,
    })

    const handlePinDeleted = (pinId: string) => {
        queryClient.setQueryData(['my-pins'], (old: any[] | undefined) =>
            (old || []).filter((p) => p.id !== pinId)
        )
        queryClient.invalidateQueries({ queryKey: ['pins'] })
    }

    if (loadingUser && !currentUser) {
        return <UserProfileSkeleton />
    }

    if (!currentUser) {
        return (
            <AuthGate
                icon={FiUser}
                title="پروفایل کاربری شما"
                description="برای مشاهده پین‌ها، دنبال‌کنندگان و مدیریت حساب کاربری خود وارد شوید."
                redirectUrl="/profile"
            />
        )
    }

    return (
        <main className="mb-18">
            <div className="relative overflow-hidden bg-[#150a08] px-4 sm:px-8 pt-14 pb-20 sm:pb-24">
                <div className="absolute -top-24 -right-16 w-72 h-72 bg-red-600/40 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute -bottom-24 -left-16 w-80 h-80 bg-orange-500/30 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-fuchsia-600/15 rounded-full blur-[90px]" />

                <FiMapPin className="hero-float hero-float-1 absolute top-[20%] left-[10%] w-6 h-6 text-white/15" />
                <FiMapPin className="hero-float hero-float-2 absolute top-[15%] right-[14%] w-8 h-8 text-white/10" />
                <FiMapPin className="hero-float hero-float-3 absolute bottom-[18%] left-[20%] w-5 h-5 text-white/15" />

                <div className="relative z-10 max-w-6xl mx-auto flex flex-col items-center text-center">
                    <div className="relative group">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-500 to-orange-500 opacity-0 group-hover:opacity-30 blur-lg transition-opacity duration-500" />
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gradient-to-br from-red-500 via-red-600 to-orange-500 ring-4 ring-white/20 shadow-2xl flex items-center justify-center text-4xl sm:text-5xl font-black text-white transition-all duration-300 group-hover:scale-105 group-hover:ring-white/40 group-hover:shadow-2xl">
                            {currentUser.avatar ? (
                                <img
                                    src={currentUser.avatar}
                                    alt={currentUser.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="leading-none">
                                    {currentUser.username?.charAt(0).toUpperCase() || '؟'}
                                </span>
                            )}
                        </div>
                    </div>

                    <h1 className="text-white text-2xl sm:text-3xl font-extrabold tracking-tight mt-5 transition-transform duration-300 hover:scale-[1.02]">
                        {currentUser.name}
                    </h1>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-2.5 mt-3">
                        <span className="flex items-center gap-1 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1.5 rounded-full ring-1 ring-white/10 transition-all duration-200 hover:bg-white/20 hover:scale-105 hover:ring-white/30 cursor-default">
                            <span>{currentUser.username}</span><FiAtSign className="w-3 h-3" />
                        </span>
                        <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm text-white/80 text-xs font-medium px-3 py-1.5 rounded-full ring-1 ring-white/10 transition-all duration-200 hover:bg-white/20 hover:scale-105 hover:ring-white/30 cursor-default">
                            {currentUser.email}<FiMail className="w-3 h-3" />
                        </span>
                    </div>
                    <div className="mt-6 flex items-center gap-5 sm:gap-7">
                        <div className="group/stat flex flex-col items-center gap-1.5 cursor-default">
                            <div className="flex items-center gap-1.5">
                                <FiGrid className="w-5 h-5 text-red-400/60 transition-all duration-300 group-hover/stat:text-red-400 group-hover/stat:scale-110" />
                                <span className="text-xl sm:text-2xl font-black tabular-nums leading-none bg-gradient-to-br from-red-400 to-orange-400 bg-clip-text text-transparent">
                                    {pins.length}
                                </span>
                            </div>
                            <span className="text-[11px] text-white/50 font-semibold">پین</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-red-500 to-orange-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-400 ease-out" />
                        </div>

                        <span className="w-1 h-1 rounded-full bg-white/20" />

                        <Link
                            href={`/user/${currentUser.id}/connections?tab=followers`}
                            className="group/stat flex flex-col items-center gap-1.5 no-underline"
                        >
                            <div className="flex items-center gap-1.5">
                                <FiUserPlus className="w-5 h-5 text-fuchsia-400/60 transition-all duration-300 group-hover/stat:text-fuchsia-400 group-hover/stat:scale-110" />
                                <span className="text-xl sm:text-2xl font-black tabular-nums leading-none bg-gradient-to-br from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                                    {followersCount}
                                </span>
                            </div>
                            <span className="text-[11px] text-white/50 font-semibold">دنبال‌کننده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-fuchsia-500 to-purple-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-400 ease-out" />
                        </Link>

                        <span className="w-1 h-1 rounded-full bg-white/20" />

                        <Link
                            href={`/user/${currentUser.id}/connections?tab=following`}
                            className="group/stat flex flex-col items-center gap-1.5 no-underline"
                        >
                            <div className="flex items-center gap-1.5">
                                <FiUsers className="w-5 h-5 text-blue-400/60 transition-all duration-300 group-hover/stat:text-blue-400 group-hover/stat:scale-110" />
                                <span className="text-xl sm:text-2xl font-black tabular-nums leading-none bg-gradient-to-br from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                    {followingCount}
                                </span>
                            </div>
                            <span className="text-[11px] text-white/50 font-semibold">دنبال‌شده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-blue-500 to-cyan-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-400 ease-out" />
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 -mt-8 relative z-10">
                <div className="bg-white rounded-3xl overflow-hidden shadow-[0_10px_40px_-15px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-all duration-300 hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] hover:ring-black/10">
                    <div className="h-1.5 bg-gradient-to-r from-red-700 to-orange-600" />

                    <div className="p-5 sm:p-7">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center transition-transform duration-300 hover:rotate-6">
                                <FiImage className="w-4 h-4 text-red-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">پین‌های شما</h2>
                        </div>

                        {loadingPins ? (
                            <PinGridSkeleton count={8} />
                        ) : pins.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-gray-50 ring-1 ring-black/5 flex items-center justify-center mb-4">
                                    <FiImage className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-500 text-sm mb-5">هنوز پینی نساخته‌اید.</p>
                                <Link
                                    href="/create"
                                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-red-100 transition-all hover:scale-105 active:scale-95 no-underline"
                                >
                                    <FiPlus className="w-4 h-4" />
                                    ساخت اولین پین
                                </Link>
                            </div>
                        ) : (
                            <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                                {pins.map((pin: any) => (
                                    <PinCard
                                        key={pin.id}
                                        pin={pin}
                                        onDeletePin={handlePinDeleted}
                                        optionsRotationDefault={-105}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes heroFloat1 {
                    0%, 100% { transform: translateY(0) rotate(-6deg); }
                    50% { transform: translateY(-14px) rotate(-2deg); }
                }
                @keyframes heroFloat2 {
                    0%, 100% { transform: translateY(0) rotate(8deg); }
                    50% { transform: translateY(-18px) rotate(4deg); }
                }
                @keyframes heroFloat3 {
                    0%, 100% { transform: translateY(0) rotate(-4deg); }
                    50% { transform: translateY(-10px) rotate(2deg); }
                }
                .hero-float-1 { animation: heroFloat1 4.5s ease-in-out infinite; }
                .hero-float-2 { animation: heroFloat2 5.5s ease-in-out infinite; }
                .hero-float-3 { animation: heroFloat3 5s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                    .hero-float-1, .hero-float-2, .hero-float-3 { animation: none; }
                }
            `}</style>
        </main>
    )
}