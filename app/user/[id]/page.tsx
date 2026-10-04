"use client"

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import PinCard from '@/app/components/PinCard'
import Image from 'next/image'
import { useAuthStore } from '@/lib/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Spinner from '@/app/components/Spinner'

import {
    FiArrowRight,
    FiAtSign,
    FiImage,
    FiGrid,
    FiMessageCircle,
    FiUserPlus,
    FiCheck,
    FiSettings,
} from 'react-icons/fi'

// ═══════════ تایپ‌ها ═══════════

type Tab = 'followers' | 'following'

type UserProfile = {
    id: string
    name: string
    username: string
    avatar: string | null
    bio: string | null
    isFollowing: boolean
    followersCount: number
    followingCount: number
}

type ProfileResponse = {
    user: UserProfile
    pins: any[]
}

// ✅ کامپوننت اصلی — wrapped در Suspense (برای useSearchParams)
export default function UserProfilePage() {
    return (
        <Suspense
            fallback={
                <main dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                    <Spinner size="lg" />
                </main>
            }
        >
            <UserProfileContent />
        </Suspense>
    )
}

// ✅ بدنه‌ی صفحه
function UserProfileContent() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialTab = searchParams.get('tab') === 'following' ? 'following' : 'followers'
    const [tab, setTab] = useState<Tab>(initialTab)
    const { user: currentUser } = useAuthStore()
    const queryClient = useQueryClient()

    // ── Query: اطلاعات کاربر + پین‌ها ──
    const {
        data,
        isLoading: loading,
        isError,
        error,
    } = useQuery<ProfileResponse>({
        queryKey: ['user', id],
        queryFn: async () => {
            const res = await fetch(`/api/users/${id}`)
            if (!res.ok) throw new Error('کاربر یافت نشد')
            return res.json()
        },
        enabled: !!id,
        staleTime: 60 * 1000,
    })

    const profileUser = data?.user
    const pins = data?.pins ?? []

    // ── Mutation: فالو/آنفالو ──
    const followMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/users/${id}/follow`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در فالو')
            return res.json()
        },
        onSuccess: (resData: { isFollowing: boolean; followersCount: number }) => {
            queryClient.setQueryData<ProfileResponse>(['user', id], (old) => {
                if (!old) return old
                return {
                    ...old,
                    user: {
                        ...old.user,
                        isFollowing: resData.isFollowing,
                        followersCount: resData.followersCount,
                    },
                }
            })
            queryClient.invalidateQueries({ queryKey: ['user', id] })
        },
    })

    const handleFollow = () => {
        if (!currentUser) {
            router.push('/login')
            return
        }
        followMutation.mutate()
    }

    const handleMessage = () => {
        if (!currentUser) {
            router.push('/login')
            return
        }
        if (!profileUser) return
        router.push(`/messages/new?userId=${profileUser.id}`)
    }

    if (loading) {
        return (
            <main dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                <Spinner size="lg" />
            </main>
        )
    }

    if (isError || !profileUser) {
        return (
            <main dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gradient-to-br from-red-50 via-white to-orange-50">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center">
                    <FiAtSign className="w-9 h-9 text-red-300" />
                </div>
                <p className="text-gray-800 font-bold text-xl">
                    {(error as Error)?.message || 'کاربر یافت نشد'}
                </p>
                <Link href="/" className="text-red-600 font-semibold hover:underline">
                    بازگشت به خانه
                </Link>
            </main>
        )
    }

    const isOwnProfile = currentUser?.id === profileUser.id

    return (
        <main dir="rtl" className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
            {/* ═══════════ هیروی مینیمال روشن ═══════════ */}
            <div className="relative">
                <div className="h-28 sm:h-32 bg-gradient-to-l from-red-500/80 via-rose-500/70 to-orange-400/80 relative overflow-hidden">
                    <div className="absolute -top-10 left-1/4 w-48 h-48 bg-white/15 rounded-full blur-2xl" />
                    <div className="absolute -bottom-16 right-1/4 w-56 h-56 bg-white/10 rounded-full blur-3xl" />
                </div>

                <button
                    onClick={() => router.back()}
                    className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 backdrop-blur-md ring-1 ring-white/30 flex items-center justify-center text-white transition-all cursor-pointer group"
                    title="بازگشت"
                >
                    <FiArrowRight className="w-4 h-4" />
                </button>

                <div className="max-w-2xl mx-auto px-4">
                    <div className="relative -mt-14 sm:-mt-16 w-fit mx-auto group">
                        <div className="p-[3px] rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 shadow-xl shadow-red-200/50 transition-transform duration-300 group-hover:scale-[1.03]">
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-white ring-4 ring-white flex items-center justify-center text-3xl sm:text-4xl font-black text-white bg-gradient-to-br from-red-500 to-orange-500">
                                {profileUser.avatar ? (
                                    <Image
                                        src={profileUser.avatar}
                                        alt={profileUser.name}
                                        width={112}
                                        height={112}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="leading-none">
                                        {profileUser.username?.charAt(0).toUpperCase() || '؟'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            {profileUser.name}
                        </h1>
                        <p className="flex items-center justify-center gap-1 text-sm text-gray-400 font-medium mt-1.5">
                            <FiAtSign className="w-3.5 h-3.5" />
                            {profileUser.username}
                        </p>

                        {profileUser.bio && (
                            <p className="text-[15px] text-gray-600 leading-relaxed mt-3 max-w-md mx-auto">
                                {profileUser.bio}
                            </p>
                        )}
                    </div>

                    {/* ═══ آمار — پین‌ها عادی، فالوور/دنبال‌شونده لینک به connections ═══ */}
                    <div className="mt-6 flex items-center justify-center gap-5 sm:gap-7">

                        {/* ── پین‌ها — بدون لینک (فقط آمار) ── */}
                        <div className="group/stat flex flex-col items-center gap-1 cursor-default">
                            <div className="flex items-center gap-1.5">
                                <FiGrid className="w-3.5 h-3.5 text-red-400/50 transition-all duration-300 group-hover/stat:text-red-500 group-hover/stat:scale-110" />
                                <span className="text-lg sm:text-xl font-black tabular-nums leading-none bg-gradient-to-br from-red-500 to-orange-400 bg-clip-text text-transparent">
                                    {pins.length.toLocaleString('fa-IR')}
                                </span>
                            </div>
                            <span className="text-[11px] text-gray-400 font-semibold">پین</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-red-500 to-orange-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-300" />
                        </div>

                        <span className="w-1 h-1 rounded-full bg-gray-200" />

                        {/* ── دنبال‌کننده‌ها — کلیک → connections ── */}
                        <Link
                            href={`/user/${id}/connections?tab=followers`}
                            className="group/stat flex flex-col items-center gap-1 no-underline"
                        >
                            <span className="text-lg sm:text-xl font-black tabular-nums leading-none bg-gradient-to-br from-fuchsia-500 to-purple-400 bg-clip-text text-transparent">
                                {profileUser.followersCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold">دنبال‌کننده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-fuchsia-500 to-purple-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-300" />
                        </Link>

                        <span className="w-1 h-1 rounded-full bg-gray-200" />

                        {/* ── دنبال‌شده‌ها — کلیک → connections ── */}
                        <Link
                            href={`/user/${id}/connections?tab=following`}
                            className="group/stat flex flex-col items-center gap-1 no-underline"
                        >
                            <span className="text-lg sm:text-xl font-black tabular-nums leading-none bg-gradient-to-br from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                                {profileUser.followingCount.toLocaleString('fa-IR')}
                            </span>
                            <span className="text-[11px] text-gray-400 font-semibold">دنبال‌شونده</span>
                            <span className="h-0.5 w-0 rounded-full bg-gradient-to-l from-blue-500 to-cyan-400 opacity-0 group-hover/stat:opacity-100 group-hover/stat:w-full transition-all duration-300" />
                        </Link>
                    </div>

                    {/* دکمه اکشن */}
                    <div className="mt-6 flex justify-center">
                        {isOwnProfile ? (
                            <Link
                                href="/settings"
                                className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 bg-white ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50 px-6 py-2.5 rounded-full transition-all no-underline shadow-sm"
                            >
                                <FiSettings className="w-4 h-4 text-gray-400" />
                                ویرایش پروفایل
                            </Link>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleFollow}
                                    disabled={followMutation.isPending}
                                    className={`inline-flex items-center gap-2 text-sm font-bold px-7 py-2.5 rounded-full transition-all cursor-pointer active:scale-95 ${profileUser.isFollowing
                                        ? 'text-gray-700 bg-white ring-1 ring-gray-300 hover:ring-gray-400 shadow-sm'
                                        : 'text-white bg-gray-900 hover:bg-black shadow-lg shadow-gray-300/60 hover:-translate-y-0.5'
                                        } ${followMutation.isPending ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    {followMutation.isPending ? (
                                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
                                    ) : profileUser.isFollowing ? (
                                        <FiCheck className="w-4 h-4" />
                                    ) : (
                                        <FiUserPlus className="w-4 h-4" />
                                    )}
                                    {profileUser.isFollowing ? 'دنبال می‌کنید' : 'دنبال کردن'}
                                </button>

                                <button
                                    onClick={handleMessage}
                                    className="inline-flex items-center gap-2 text-sm font-bold px-6 py-2.5 rounded-full text-gray-700 bg-white ring-1 ring-gray-300 hover:ring-gray-400 hover:bg-gray-50 transition-all cursor-pointer active:scale-95 shadow-sm"
                                >
                                    <FiMessageCircle className="w-4 h-4 text-gray-400" />
                                    پیام
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════ پین‌های کاربر ═══════════ */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-12 mb-16">
                <div className="flex items-center gap-3 mb-6">
                    <h2 className="flex items-center gap-2 font-bold text-gray-900 text-sm shrink-0">
                        <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                            <FiImage className="w-3.5 h-3.5 text-red-500" />
                        </span>
                        پین‌های {profileUser.name}
                    </h2>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {pins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-100 flex items-center justify-center mb-4 rotate-3">
                            <FiImage className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="text-gray-600 text-sm font-bold">این کاربر هنوز پینی نساخته است</p>
                        <p className="text-gray-400 text-xs mt-1">به‌زودی شاید ایده‌های جدیدی اضافه کنه ✨</p>
                    </div>
                ) : (
                    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
                        {pins.map((pin: any, index: number) => (
                            <PinCard key={pin.id} pin={pin} priority={index < 4} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    )
}