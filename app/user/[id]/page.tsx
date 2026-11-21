"use client"

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import PinCard from '@/app/components/PinCard'
import PinGridSkeleton from '@/app/components/skeletons/PinGridSkeleton'
import { useAuthStore } from '@/lib/authStore'

import {
    FiArrowRight,
    FiArrowUpLeft,
    FiAtSign,
    FiImage,
    FiGrid,
    FiMessageCircle,
    FiUserPlus,
    FiUsers,
    FiCheck,
    FiSettings,
    FiShare2,
    FiSearch,
    FiX,
    FiPlus,
    FiRotateCcw,
} from 'react-icons/fi'

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

export default function UserProfilePage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user: currentUser } = useAuthStore()
    const queryClient = useQueryClient()

    const [pinSearch, setPinSearch] = useState('')
    const [copiedLink, setCopiedLink] = useState(false)
    const [copiedUsername, setCopiedUsername] = useState(false)
    const [avatarError, setAvatarError] = useState(false)
    const [showUndoToast, setShowUndoToast] = useState(false)

    const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const galleryRef = useRef<HTMLElement | null>(null)

    useEffect(() => {
        return () => {
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        }
    }, [])

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

    useEffect(() => {
        setAvatarError(false)
    }, [profileUser?.avatar])

    const backdropImages = useMemo(() => {
        return pins
            .filter((p) => p?.imageUrl)
            .slice(0, 4)
            .map((p) => p.imageUrl as string)
    }, [pins])

    const filteredPins = useMemo(() => {
        const q = pinSearch.trim().toLowerCase()
        if (!q) return pins
        return pins.filter((p) => {
            const title = (p?.title || '').toLowerCase()
            const desc = (p?.description || '').toLowerCase()
            return title.includes(q) || desc.includes(q)
        })
    }, [pins, pinSearch])

    const followMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`/api/users/${id}/follow`, { method: 'POST' })
            if (!res.ok) throw new Error('خطا در تغییر وضعیت دنبال کردن')
            return res.json() as Promise<{ isFollowing: boolean; followersCount: number }>
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['user', id] })
            const previousData = queryClient.getQueryData<ProfileResponse>(['user', id])

            queryClient.setQueryData<ProfileResponse>(['user', id], (old) => {
                if (!old) return old
                const nextFollowing = !old.user.isFollowing
                return {
                    ...old,
                    user: {
                        ...old.user,
                        isFollowing: nextFollowing,
                        followersCount: Math.max(
                            0,
                            old.user.followersCount + (nextFollowing ? 1 : -1)
                        ),
                    },
                }
            })

            return { previousData }
        },
        onSuccess: (resData) => {
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
            queryClient.invalidateQueries({ queryKey: ['follow-stats'] })
        },
        onError: (_err, _vars, context) => {
            if (context?.previousData) {
                queryClient.setQueryData(['user', id], context.previousData)
            }
            setShowUndoToast(false)
        },
    })

    const handleFollow = () => {
        if (!currentUser) {
            router.push('/login')
            return
        }
        if (!profileUser || followMutation.isPending) return

        if (profileUser.isFollowing) {
            setShowUndoToast(true)
            if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
            undoTimerRef.current = setTimeout(() => setShowUndoToast(false), 4000)
        } else {
            setShowUndoToast(false)
        }

        followMutation.mutate()
    }

    const handleUndoUnfollow = () => {
        if (followMutation.isPending) return
        setShowUndoToast(false)
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
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

    const handleCopy = async (text: string, type: 'link' | 'username') => {
        try {
            await navigator.clipboard.writeText(text)
            if (type === 'link') {
                setCopiedLink(true)
                setTimeout(() => setCopiedLink(false), 2000)
            } else {
                setCopiedUsername(true)
                setTimeout(() => setCopiedUsername(false), 1800)
            }
        } catch {
        }
    }

    const scrollToGallery = () => {
        galleryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    if (loading) {
        return <UserProfileBentoSkeleton />
    }

    if (isError || !profileUser) {
        return (
            <main
                dir="rtl"
                className="relative min-h-[82vh] flex flex-col items-center justify-center px-4 overflow-hidden bg-white pb-20"
            >
                <div className="pointer-events-none absolute -top-24 right-1/3 h-80 w-80 rounded-full bg-rose-200/35 blur-3xl" />
                <div className="relative z-10 w-full max-w-sm rounded-[28px] bg-white p-7 text-center shadow-xl shadow-gray-200/60 ring-1 ring-black/[0.06] space-y-4 animate-[fadeInUp_0.3s_ease-out]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                        <FiAtSign className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-base sm:text-lg font-extrabold text-gray-900">
                            {(error as Error)?.message || 'کاربر یافت نشد'}
                        </h1>
                        <p className="text-xs text-gray-500 leading-relaxed">
                            ممکن است این حساب کاربری حذف شده یا آدرس آن تغییر کرده باشد.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                        >
                            بازگشت
                        </button>
                        <Link
                            href="/"
                            className="flex-1 rounded-xl bg-gray-950 hover:bg-red-600 py-2.5 text-xs font-bold text-white transition-colors no-underline"
                        >
                            صفحه اصلی
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    const isOwnProfile = currentUser?.id === profileUser.id
    const profileUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/user/${profileUser.id}`
            : ''

    return (
        <main dir="rtl" className="min-h-screen bg-white pb-28 lg:pb-16">
            <section className="relative overflow-hidden pt-4 sm:pt-7 pb-8 sm:pb-10 px-4 sm:px-6 lg:px-8">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    {backdropImages.length > 0 ? (
                        <div className="grid h-full w-full grid-cols-2 sm:grid-cols-4 scale-110 opacity-30 blur-3xl saturate-150">
                            {backdropImages.map((src, i) => (
                                <img
                                    key={i}
                                    src={src}
                                    alt=""
                                    className="h-full w-full object-cover"
                                />
                            ))}
                        </div>
                    ) : (
                        <>
                            <div className="absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-rose-300/35 blur-3xl" />
                            <div className="absolute -top-16 left-1/4 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
                        </>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/55 via-white/80 to-white" />
                </div>

                <div className="relative mx-auto max-w-[1400px]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            aria-label="بازگشت"
                            className="group inline-flex h-9 items-center gap-2 rounded-full bg-white/85 backdrop-blur-md px-3.5
                                text-xs font-bold text-gray-700 ring-1 ring-black/[0.08] shadow-xs
                                hover:bg-gray-950 hover:text-white hover:ring-gray-950
                                transition-all duration-200 active:scale-95 cursor-pointer"
                        >
                            <FiArrowRight className="h-3.5 w-3.5" />
                            <span>بازگشت</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-stretch animate-[fadeInUp_0.35s_ease-out_both]">
                        <div className="lg:col-span-7 flex flex-col overflow-hidden rounded-[28px] bg-white/85 backdrop-blur-2xl ring-1 ring-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                            <div className="relative h-18 sm:h-20 w-full overflow-hidden bg-gradient-to-l from-rose-100/80 via-orange-50/70 to-zinc-100/80">
                                {backdropImages[0] && (
                                    <img
                                        src={backdropImages[0]}
                                        alt=""
                                        aria-hidden="true"
                                        className="h-full w-full object-cover scale-125 opacity-35 blur-2xl saturate-150"
                                    />
                                )}
                                <div
                                    aria-hidden="true"
                                    className="absolute inset-0 opacity-35"
                                    style={{
                                        backgroundImage: 'radial-gradient(#000000 0.75px, transparent 0.75px)',
                                        backgroundSize: '14px 14px',
                                    }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />
                            </div>

                            <div className="relative flex flex-1 flex-col justify-between px-5 sm:px-7 pb-5 sm:pb-6">
                                <div className="flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-right gap-4 sm:gap-5 -mt-10 sm:-mt-11">
                                    <div className="relative shrink-0 group">
                                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-[24px] p-[3px] bg-gradient-to-tr from-red-500 via-rose-500 to-amber-400 shadow-lg shadow-rose-500/15 ring-4 ring-white transition-transform duration-300 group-hover:scale-[1.03]">
                                            <div className="h-full w-full rounded-[21px] overflow-hidden bg-gray-950 flex items-center justify-center">
                                                {profileUser.avatar && !avatarError ? (
                                                    <Image
                                                        src={profileUser.avatar}
                                                        alt={profileUser.name}
                                                        width={96}
                                                        height={96}
                                                        onError={() => setAvatarError(true)}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-2xl sm:text-3xl font-black text-white leading-none">
                                                        {profileUser.username?.charAt(0).toUpperCase() || '؟'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1 max-w-full sm:pb-1">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
                                            <h1 className="truncate text-lg sm:text-2xl font-black text-gray-950 tracking-tight">
                                                {profileUser.name}
                                            </h1>

                                            <button
                                                type="button"
                                                onClick={() => handleCopy(`@${profileUser.username}`, 'username')}
                                                dir="ltr"
                                                title="کپی نام کاربری"
                                                className="self-center sm:self-auto inline-flex max-w-full items-center gap-1 rounded-full
                                                    bg-black/[0.045] hover:bg-black/[0.08] px-2.5 py-1 text-[11px] font-semibold text-gray-600
                                                    transition-colors cursor-pointer"
                                            >
                                                {copiedUsername ? (
                                                    <>
                                                        <FiCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                                                        <span className="text-emerald-700">کپی شد</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiAtSign className="h-3 w-3 text-gray-400 shrink-0" />
                                                        <span className="truncate">{profileUser.username}</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        {profileUser.bio ? (
                                            <p className="mt-2 text-xs sm:text-[13px] text-gray-600 leading-relaxed line-clamp-2">
                                                {profileUser.bio}
                                            </p>
                                        ) : (
                                            <p className="mt-1.5 text-xs text-gray-400">
                                                عضو جامعه Pinverse
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-black/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3.5">
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                        {isOwnProfile ? (
                                            <Link
                                                href="/settings"
                                                className="inline-flex items-center gap-1.5 rounded-full bg-gray-950 hover:bg-gray-800
                                                    px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-95 no-underline"
                                            >
                                                <FiSettings className="h-3.5 w-3.5" />
                                                ویرایش پروفایل
                                            </Link>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleFollow}
                                                disabled={followMutation.isPending}
                                                className={`min-w-[128px] inline-flex items-center justify-center gap-1.5 rounded-full
                                                    px-5 py-2.5 text-xs font-bold transition-all duration-200
                                                    cursor-pointer active:scale-95 disabled:opacity-60 ${
                                                        profileUser.isFollowing
                                                            ? 'bg-gray-100 text-gray-800 ring-1 ring-inset ring-gray-200 hover:bg-gray-200/80'
                                                            : 'bg-gray-950 text-white shadow-md shadow-gray-900/15 hover:bg-red-600'
                                                    }`}
                                            >
                                                {followMutation.isPending ? (
                                                    <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : profileUser.isFollowing ? (
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

                                        <button
                                            type="button"
                                            onClick={() => handleCopy(profileUrl, 'link')}
                                            className={`inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-bold
                                                ring-1 transition-all active:scale-95 cursor-pointer ${
                                                    copiedLink
                                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                                        : 'bg-white text-gray-700 ring-black/[0.08] hover:bg-gray-50'
                                                }`}
                                        >
                                            {copiedLink ? (
                                                <>
                                                    <FiCheck className="h-3.5 w-3.5" />
                                                    <span>لینک کپی شد</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiShare2 className="h-3.5 w-3.5 text-gray-500" />
                                                    <span>اشتراک</span>
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {backdropImages.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={scrollToGallery}
                                            className="group/preview inline-flex items-center gap-2.5 rounded-2xl bg-gray-50/90 hover:bg-gray-100/90 px-3 py-1.5 ring-1 ring-black/[0.05] transition-colors cursor-pointer"
                                        >
                                            <span className="text-[11px] font-semibold text-gray-500 group-hover/preview:text-gray-800 transition-colors">
                                                آخرین آثار
                                            </span>
                                            <div className="flex items-center -space-x-2 space-x-reverse">
                                                {backdropImages.map((src, i) => (
                                                    <span
                                                        key={i}
                                                        className="relative h-8 w-8 overflow-hidden rounded-xl ring-2 ring-white shadow-xs transition-transform duration-200 group-hover/preview:scale-105"
                                                    >
                                                        <img
                                                            src={src}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </span>
                                                ))}
                                            </div>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 grid grid-cols-2 gap-3 sm:gap-3.5">
                            <div className="relative overflow-hidden rounded-[24px] bg-[#111113] p-4 sm:p-5 text-white flex flex-col justify-between min-h-[112px]">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-red-500/30 blur-2xl"
                                />
                                <div className="relative flex items-center justify-between">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-rose-400">
                                        <FiGrid className="h-4 w-4" />
                                    </span>
                                    <span className="text-[10px] font-semibold text-white/40">گالری</span>
                                </div>
                                <div className="relative mt-3">
                                    <p className="text-2xl sm:text-3xl font-black tabular-nums leading-none">
                                        {pins.length.toLocaleString('fa-IR')}
                                    </p>
                                    <p className="mt-1 text-[11px] font-medium text-white/60">
                                        پین منتشر شده
                                    </p>
                                </div>
                            </div>

                            {isOwnProfile ? (
                                <Link
                                    href="/create"
                                    className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-red-600 via-rose-600 to-orange-500
                                        p-4 sm:p-5 text-white flex flex-col justify-between min-h-[112px]
                                        shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30
                                        hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 no-underline"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:rotate-90">
                                            <FiPlus className="h-4 w-4" />
                                        </span>
                                        <FiArrowUpLeft className="h-4 w-4 text-white/70 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-sm sm:text-base font-extrabold leading-snug">
                                            ساخت پین
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-white/80">
                                            ایده جدید منتشر کن
                                        </p>
                                    </div>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleMessage}
                                    className="group relative overflow-hidden rounded-[24px] bg-gradient-to-br from-red-600 via-rose-600 to-orange-500
                                        p-4 sm:p-5 text-right text-white flex flex-col justify-between min-h-[112px]
                                        shadow-lg shadow-rose-500/20 hover:shadow-xl hover:shadow-rose-500/30
                                        hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 cursor-pointer"
                                >
                                    <div className="flex w-full items-center justify-between">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                                            <FiMessageCircle className="h-4 w-4" />
                                        </span>
                                        <FiArrowUpLeft className="h-4 w-4 text-white/75 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-sm sm:text-base font-extrabold leading-snug">
                                            ارسال پیام
                                        </p>
                                        <p className="mt-0.5 truncate text-[11px] text-white/85">
                                            گفتگو با {profileUser.name}
                                        </p>
                                    </div>
                                </button>
                            )}

                            <Link
                                href={`/user/${id}/connections?tab=followers`}
                                className="group rounded-[24px] bg-white/85 backdrop-blur-xl p-4 sm:p-5
                                    ring-1 ring-black/[0.06] hover:ring-black/[0.14]
                                    hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
                                    flex flex-col justify-between min-h-[104px] no-underline"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                                        <FiUserPlus className="h-4 w-4" />
                                    </span>
                                    <FiArrowUpLeft className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:text-gray-900 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                                <div className="mt-3">
                                    <p className="text-xl sm:text-2xl font-black text-gray-950 tabular-nums leading-none">
                                        {profileUser.followersCount.toLocaleString('fa-IR')}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold text-gray-500">
                                        دنبال‌کننده
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href={`/user/${id}/connections?tab=following`}
                                className="group rounded-[24px] bg-white/85 backdrop-blur-xl p-4 sm:p-5
                                    ring-1 ring-black/[0.06] hover:ring-black/[0.14]
                                    hover:-translate-y-0.5 hover:shadow-md transition-all duration-200
                                    flex flex-col justify-between min-h-[104px] no-underline"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                                        <FiUsers className="h-4 w-4" />
                                    </span>
                                    <FiArrowUpLeft className="h-4 w-4 text-gray-300 transition-all duration-200 group-hover:text-gray-900 group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
                                </div>
                                <div className="mt-3">
                                    <p className="text-xl sm:text-2xl font-black text-gray-950 tabular-nums leading-none">
                                        {profileUser.followingCount.toLocaleString('fa-IR')}
                                    </p>
                                    <p className="mt-1 text-[11px] font-semibold text-gray-500">
                                        دنبال‌شده
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <section ref={galleryRef} className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-2">
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <h2 className="truncate text-sm sm:text-base font-extrabold text-gray-950">
                            پین‌های {profileUser.name}
                        </h2>
                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-bold text-gray-600 tabular-nums">
                            {filteredPins.length.toLocaleString('fa-IR')}
                        </span>
                    </div>

                    {pins.length > 0 && (
                        <div className="relative w-full sm:w-64 md:w-72">
                            <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input
                                type="text"
                                value={pinSearch}
                                onChange={(e) => setPinSearch(e.target.value)}
                                placeholder={`جستجو در پین‌های ${profileUser.name}...`}
                                className="w-full rounded-full bg-gray-50 pr-9 pl-8 py-2 text-xs text-gray-800 placeholder:text-gray-400
                                    ring-1 ring-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all"
                            />
                            {pinSearch && (
                                <button
                                    type="button"
                                    onClick={() => setPinSearch('')}
                                    aria-label="پاک کردن جستجو"
                                    className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 cursor-pointer"
                                >
                                    <FiX className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {pins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 py-16 sm:py-24 px-4 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm ring-1 ring-black/5">
                            <FiImage className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                            این کاربر هنوز پینی منتشر نکرده است
                        </p>
                        <p className="mt-1 text-xs text-gray-400 max-w-xs leading-relaxed">
                            به‌محض انتشار اولین پین، آثار اینجا نمایش داده می‌شوند.
                        </p>
                    </div>
                ) : filteredPins.length === 0 ? (
                    <div className="py-16 text-center">
                        <p className="text-xs sm:text-sm font-semibold text-gray-500">
                            پینی با عبارت «{pinSearch.trim()}» پیدا نشد
                        </p>
                        <button
                            type="button"
                            onClick={() => setPinSearch('')}
                            className="mt-3 rounded-full bg-gray-100 hover:bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                        >
                            نمایش همه پین‌ها
                        </button>
                    </div>
                ) : (
                    <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                        {filteredPins.map((pin: any, index: number) => (
                            <PinCard key={pin.id} pin={pin} priority={index < 4} />
                        ))}
                    </div>
                )}
            </section>

            {showUndoToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm animate-[fadeInUp_0.2s_ease-out]">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-white shadow-xl ring-1 ring-white/10">
                        <span className="truncate text-xs font-medium text-gray-200">
                            دنبال کردن <strong className="font-bold text-white">{profileUser.name}</strong> لغو شد
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
        </main>
    )
}

function UserProfileBentoSkeleton() {
    return (
        <main dir="rtl" className="min-h-screen bg-white pt-5 sm:pt-7 pb-20 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1400px] space-y-8">
                <div className="space-y-4 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="h-9 w-24 rounded-full bg-gray-100" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                        <div className="lg:col-span-7 overflow-hidden rounded-[28px] bg-gray-50 ring-1 ring-gray-100 flex flex-col justify-between min-h-[236px]">
                            <div className="h-20 w-full bg-gray-100" />
                            <div className="px-6 pb-6 flex-1 flex flex-col justify-between">
                                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-10">
                                    <div className="h-24 w-24 rounded-[24px] bg-gray-200 ring-4 ring-gray-50 shrink-0" />
                                    <div className="flex-1 w-full space-y-2.5 pb-1">
                                        <div className="h-5 w-40 rounded-lg bg-gray-200/80 mx-auto sm:mx-0" />
                                        <div className="h-3.5 w-2/3 rounded-md bg-gray-200/60 mx-auto sm:mx-0" />
                                    </div>
                                </div>
                                <div className="mt-5 pt-4 border-t border-gray-200/60 flex items-center justify-between gap-3">
                                    <div className="flex gap-2">
                                        <div className="h-9 w-32 rounded-full bg-gray-200/80" />
                                        <div className="h-9 w-24 rounded-full bg-gray-200/60" />
                                    </div>
                                    <div className="hidden sm:block h-10 w-36 rounded-2xl bg-gray-200/60" />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="min-h-[108px] rounded-[24px] bg-gray-50 p-5 ring-1 ring-gray-100 flex flex-col justify-between"
                                >
                                    <div className="h-8 w-8 rounded-xl bg-gray-200/70" />
                                    <div className="space-y-1.5">
                                        <div className="h-6 w-14 rounded-md bg-gray-200/80" />
                                        <div className="h-3 w-20 rounded-md bg-gray-200/60" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <PinGridSkeleton count={10} />
            </div>
        </main>
    )
}