"use client"

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/authStore'
import { IoSend } from 'react-icons/io5'
import {
    FiArrowRight,
    FiLoader,
    FiMessageCircle,
} from 'react-icons/fi'
import AuthGate from '@/app/components/AuthGate'

type OtherUser = {
    id: string
    name: string
    username: string
    avatar: string | null
}

function NewConversationContent() {
    const searchParams = useSearchParams()
    const userId = searchParams.get('userId') || ''
    const router = useRouter()
    const user = useAuthStore((state) => state.user)

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

    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // 📥 Fetch اطلاعات کاربر مقصد
    const { data: userData, isLoading: loadingUser } = useQuery<{
        user: OtherUser
        pins: any[]
    }>({
        queryKey: ['user', userId],
        queryFn: async () => {
            const res = await fetch(`/api/users/${userId}`)
            if (!res.ok) throw new Error('کاربر یافت نشد')
            return res.json()
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    })

    const otherUser = userData?.user

    // 🔍 چک کن اگه conversation موجوده، مستقیم برو بهش
    const { data: conversationsData } = useQuery<{ conversations: any[] }>({
        queryKey: ['conversations'],
        queryFn: async () => {
            const res = await fetch('/api/conversations')
            if (!res.ok) return { conversations: [] }
            return res.json()
        },
        enabled: !!currentUser && !!userId,
        staleTime: 30 * 1000,
    })

    // چک کردن conversation موجود
    useEffect(() => {
        if (!conversationsData?.conversations || !otherUser) return

        const existing = conversationsData.conversations.find(
            (c: any) => c.otherUser?.id === otherUser.id
        )

        if (existing) {
            router.replace(`/messages/${existing.id}`)
        }
    }, [conversationsData, otherUser, router])

    // فوکوس روی input
    useEffect(() => {
        if (otherUser && inputRef.current) {
            inputRef.current.focus()
        }
    }, [otherUser])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sending || !otherUser) return

        setSending(true)
        setError('')

        try {
            const res = await fetch('/api/conversations/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: otherUser.id,
                    content: newMessage.trim(),
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ارسال پیام')
            }

            const data = await res.json()
            setNewMessage('')

            // 🚀 برو به صفحه‌ی چت واقعی
            router.replace(`/messages/${data.conversationId}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
            setSending(false)
        }
    }

    // ── حالت‌های لودینگ/خطا ──
    if (checkingAuth && !currentUser) {
        return (
            <div className="h-full flex items-center justify-center">
                <FiLoader className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        )
    }

    if (!currentUser) {
        return (
            <AuthGate
                icon={FiMessageCircle}
                title="ارسال پیام جدید"
                description="برای شروع گفتگو و ارسال پیام، ابتدا وارد حساب کاربری خود شوید."
                redirectUrl={`/messages/new?userId=${userId}`}
            />
        )
    }

    if (loadingUser || !otherUser) {
        return (
            <div className="h-full flex items-center justify-center">
                <FiLoader className="w-8 h-8 text-red-500 animate-spin" />
            </div>
        )
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 via-white to-red-50/30">
            {/* ═══ هدر ═══ */}
            <header className="shrink-0 z-30 bg-white/85 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="بازگشت"
                        className="shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-600 transition-all cursor-pointer active:scale-90 group"
                    >
                        <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white shadow-md overflow-hidden shrink-0">
                            {otherUser.avatar ? (
                                <Image
                                    src={otherUser.avatar}
                                    alt={otherUser.name}
                                    width={36}
                                    height={36}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span>
                                    {otherUser.username?.charAt(0).toUpperCase() || '؟'}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-base font-extrabold text-gray-900 leading-tight truncate">
                                {otherUser.name}
                            </h1>
                            <p className="text-[11px] text-gray-400 font-medium" dir="ltr">
                                @{otherUser.username}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* ═══ حالت خالی — خوش‌آمد ═══ */}
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-6 text-center">

                {/* سلام تایپوگرافیک بزرگ */}
                <div className="animate-[chatIn_0.55s_ease-out_both]">
                    <p className="text-xs font-bold text-red-500 tracking-widest uppercase mb-3">
                        پیام جدید
                    </p>
                    <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-[1.35]">
                        سلام! آماده‌ی
                        <br />
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-l from-red-600 to-rose-500 bg-clip-text text-transparent">
                                گفتگو
                            </span>
                            {/* خط دست‌کش زیر کلمه — با انیمیشن draw */}
                            <svg
                                className="absolute -bottom-2 left-0 w-full h-2.5"
                                viewBox="0 0 100 10"
                                preserveAspectRatio="none"
                            >
                                <path
                                    d="M2 7 Q 30 2, 50 5 T 98 4"
                                    fill="none"
                                    stroke="#fb7185"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    className="animate-[drawLine_0.7s_ease-out_0.5s_both]"
                                />
                            </svg>
                        </span>
                        <br />
                        هستی؟
                    </h2>
                </div>

                {/* چیپ کاربر: آواتار + اسم — یه خط کم‌رنگ زیر تیتر */}
                <div
                    className="mt-8 flex items-center gap-2.5 bg-white/80 backdrop-blur-sm ring-1 ring-gray-200/70 shadow-sm rounded-full p-1.5 pl-4 animate-[chatIn_0.55s_ease-out_0.2s_both]"
                >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 ring-2 ring-red-100 shrink-0">
                        {otherUser.avatar ? (
                            <Image
                                src={otherUser.avatar}
                                alt={otherUser.name}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-black text-white flex items-center justify-center w-full h-full">
                                {otherUser.username?.charAt(0).toUpperCase() || '؟'}
                            </span>
                        )}
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                        {otherUser.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                        منتظرته
                    </span>
                </div>

            </div>

            {/* ═══ فرم ارسال ═══ */}
            <footer className="shrink-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                {error && (
                    <div className="max-w-2xl mx-auto px-4 pt-3">
                        <p className="text-red-500 text-xs text-center">{error}</p>
                    </div>
                )}
                <form
                    onSubmit={handleSend}
                    className="max-w-2xl mx-auto flex items-center gap-2 px-3 sm:px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        aria-label="ارسال پیام"
                        className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${newMessage.trim() && !sending
                            ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-300/60 hover:shadow-xl hover:-translate-y-0.5 active:scale-90'
                            : 'bg-gray-200/80 text-gray-400 cursor-not-allowed scale-95'
                            }`}
                    >
                        {sending ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <IoSend className="w-5 h-5 me-1" />
                        )}
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اولین پیامت رو بنویس..."
                        className="flex-1 min-w-0 bg-gray-100 ring-1 ring-gray-200/70 rounded-xl px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-300/60 transition-all duration-200"
                    />
                </form>
            </footer>
            <style>{`
                /* نفس کشیدن آروم هاله پشت آواتار */
                @keyframes breath {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50%      { opacity: 0.9; transform: scale(1.1); }
                }
            `}</style>
        </div>

    )

}

export default function NewConversationPage() {
    return (
        <Suspense
            fallback={
                <div className="h-full flex items-center justify-center">
                    <FiLoader className="w-8 h-8 text-red-500 animate-spin" />
                </div>
            }
        >
            <NewConversationContent />
        </Suspense>
    )
}