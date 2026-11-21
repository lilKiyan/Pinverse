"use client"

import Link from 'next/link'
import { useAuthStore } from '@/lib/authStore'
import { FiMessageCircle, FiArrowLeft, FiArrowRight, FiMail } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'

type Conversation = {
    id: string
    otherUser: {
        id: string
        name: string
        username: string
        avatar: string | null
    } | null
    lastMessage: {
        content: string
        createdAt: string
        senderId: string
        pinId?: string | null
    } | null
    updatedAt: string
    unreadCount: number
}

const timeAgo = (date: string | Date) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return 'همین حالا'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} دقیقه`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ساعت`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} روز`
    return new Date(date).toLocaleDateString('fa-IR')
}

const SkeletonRow = ({ delay }: { delay: number }) => (
    <div
        className="flex items-center gap-4 p-4 bg-white/60 rounded-2xl ring-1 ring-gray-100 animate-pulse"
        style={{ animationDelay: `${delay}ms` }}
    >
        <div className="w-12 h-12 rounded-full bg-gray-200/70 shrink-0" />
        <div className="flex-1 space-y-2.5">
            <div className="h-3.5 w-28 rounded-full bg-gray-200/70" />
            <div className="h-3 w-3/4 rounded-full bg-gray-100" />
        </div>
        <div className="h-3 w-10 rounded-full bg-gray-100 shrink-0" />
    </div>
)

export default function MessagesPage() {
    const { user } = useAuthStore()

    const { data: conversations = [], isLoading: loading, isError, error, refetch } = useQuery<Conversation[]>({
        queryKey: ['conversations', user?.id],
        queryFn: async () => {
            const res = await fetch('/api/conversations')
            if (!res.ok) throw new Error('خطا در دریافت گفتگوها')
            const data = await res.json()
            return data.conversations || []
        },
        enabled: !!user,
        refetchInterval: 5000,
        staleTime: 2 * 1000,
    })


    if (!user) {
        return (
            <main dir="rtl" className="min-h-screen flex flex-col items-center justify-center gap-5 px-4 bg-gradient-to-br from-gray-50 via-white to-red-50/40">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-xl shadow-gray-200/50 ring-1 ring-black/5 flex items-center justify-center rotate-3">
                    <FiMail className="w-9 h-9 text-red-300" />
                </div>
                <p className="text-gray-700 font-bold text-lg">برای مشاهده پیام‌ها وارد شوید</p>
                <Link
                    href="/login"
                    className="bg-red-600 text-white px-7 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-red-200/70 hover:bg-red-700 hover:-translate-y-0.5 transition-all no-underline"
                >
                    ورود به حساب
                </Link>
            </main>
        )
    }


    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 px-4 py-6 md:py-10"
        >
            {/* عناصر تزئینی پس‌زمینه */}
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto">
                {/* ═══ هدر ═══ */}
                <div className="flex items-center gap-2 mb-8 animate-[msgIn_0.5s_ease-out_both]">
                    <Link
                        href="/"
                        aria-label="بازگشت"
                        className="w-11 h-11 shrink-0 rounded-2xl bg-white shadow-md shadow-gray-200/60 ring-1 ring-black/5 flex items-center justify-center text-gray-500 hover:text-red-600 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all no-underline group"
                    >
                        <FiArrowRight className="w-5 h-5 transition-transform" />
                    </Link>
                    <div className="min-w-0">
                        <h1 className="flex items-center gap-2.5 text-md md:text-xl font-extrabold text-gray-900 tracking-tight">
                            پیام‌ها
                            {!loading && conversations.length > 0 && (
                                <span className="text-xs font-extrabold bg-red-50 text-red-600 ring-1 ring-red-100 px-2.5 py-1 rounded-full tabular-nums translate-y-0.5">
                                    {conversations.length}
                                </span>
                            )}
                        </h1>
                        <p className="text-xs  text-gray-400 font-medium mt-0.5">گفتگوهای اخیر شما</p>
                    </div>
                </div>

                {/* ═══ محتوا ═══ */}
                {loading ? (
                    <div className="space-y-2.5">
                        <SkeletonRow delay={0} />
                        <SkeletonRow delay={80} />
                        <SkeletonRow delay={160} />
                        <SkeletonRow delay={240} />
                        <SkeletonRow delay={320} />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center py-16 text-center animate-[msgIn_0.4s_ease-out_both]">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center -rotate-3">
                            <FiMessageCircle className="w-7 h-7 text-red-300" />
                        </div>
                        <p className="text-gray-600 font-bold">
                            {(error as Error)?.message || 'خطا در دریافت گفتگوها'}
                        </p>
                        <button
                            onClick={() => refetch()}
                            className="mt-4 text-sm font-bold text-red-600 hover:underline cursor-pointer"
                        >
                            تلاش مجدد
                        </button>
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="text-center py-20 animate-[msgIn_0.5s_ease-out_both]">
                        <div className="relative w-fit mx-auto mb-6">
                            <div className="absolute inset-0 bg-red-100/60 rounded-full blur-2xl scale-125 pointer-events-none" />
                            <div className="relative w-20 h-20 rounded-[1.75rem] bg-white shadow-xl shadow-gray-200/60 ring-1 ring-black/5 flex items-center justify-center rotate-3">
                                <FiMessageCircle className="w-9 h-9 text-gray-300" />
                                <span className="absolute -bottom-2 -left-2 w-9 h-9 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/70 flex items-center justify-center -rotate-6 animate-[msgBounce_3s_ease-in-out_infinite]">
                                    <FiMail className="w-5 h-5 text-white" />
                                </span>
                            </div>
                        </div>
                        <p className="text-gray-800 font-bold text-lg">هنوز گفتگویی ندارید</p>
                        <p className="text-gray-400 text-sm mt-1.5">
                            از صفحه‌ی پروفایل کاربران، گفتگوی جدید شروع کنید ✨
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {conversations.map((conv, index) => {
                            const other = conv.otherUser
                            return (
                                <Link
                                    key={conv.id}
                                    href={`/messages/${conv.id}`}
                                    className="group relative flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm shadow-gray-200/50 ring-1 ring-black/5 hover:shadow-xl hover:shadow-red-100/40 hover:ring-red-200/70 hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-300 no-underline animate-[msgIn_0.5s_ease-out_backwards] overflow-hidden"
                                    style={{ animationDelay: `${Math.min(index * 70, 560)}ms` }}
                                >
                                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-2/3 rounded-full bg-gradient-to-b from-red-500 to-orange-400 transition-all duration-300" />
                                    <div className="relative shrink-0">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden ring-2 ring-white shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-200/60">
                                            {other?.avatar ? (
                                                <img src={other.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                                            ) : (
                                                other?.username?.charAt(0).toUpperCase() || '؟'
                                            )}
                                        </div>
                                        <span className="absolute inset-0 rounded-full bg-red-400/30 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                                        {/* ✅ نشانگر پیام جدید */}
                                        {conv.unreadCount > 0 && (
                                            <span className="absolute -top-1.5 -left-1.5 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
                                                {conv.unreadCount > 9 ? '۹+' : conv.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-extrabold text-gray-900 truncate text-[15px] group-hover:text-red-700 transition-colors duration-200">
                                            {other?.name || 'کاربر'}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-500 truncate mt-0.5 leading-relaxed">
                                            {conv.lastMessage ? (
                                                <>
                                                    {conv.lastMessage.senderId === user.id && (
                                                        <span className="font-bold text-gray-400">شما: </span>
                                                    )}
                                                    {conv.lastMessage.pinId
                                                        ? (conv.lastMessage.senderId === user.id
                                                            ? '📌 پینی را به اشتراک گذاشتید'
                                                            : '📌 پینی برای شما ارسال کرد')
                                                        : conv.lastMessage.content}
                                                </>
                                            ) : (
                                                <span className="italic text-gray-400">شروع گفتگو...</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1.5 shrink-0 pl-1">
                                        <span className="text-[11px] text-gray-400 font-semibold whitespace-nowrap tabular-nums">
                                            {timeAgo(conv.updatedAt)} پیش
                                        </span>
                                        <span className="w-6 h-6 mr-10 rounded-full bg-red-50 flex items-center justify-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                                            <FiArrowLeft className="w-3.5 h-3.5 text-red-500" />
                                        </span>
                                    </div>
                                </Link>

                            )
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes msgIn {
                    from { opacity: 0; transform: translateY(14px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes msgBounce {
                    0%, 100% { transform: rotate(-6deg) translateY(0); }
                    50%      { transform: rotate(-6deg) translateY(-4px); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}