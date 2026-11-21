"use client"

import { useEffect, useRef, useState, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { IoSend } from 'react-icons/io5'
import { FiArrowRight, FiMessageCircle, FiChevronDown, FiAlertCircle } from 'react-icons/fi'
import { CONTENT_LIMITS } from '@/lib/validations'
import Spinner from '@/app/components/Spinner'
import type { SharedPinInfo } from '../../types/pin'
import SharedPinCard from '@/app/components/SharedPinCard'

type Message = {
    id: string
    content: string
    createdAt: string
    senderId: string
    sender?: {
        id: string
        name: string
        username: string
        avatar: string | null
    }
    isRead: boolean
    pinId?: string | null          
    pin?: SharedPinInfo | null  
}


type OtherUser = {
    id: string
    name: string
    username: string
    avatar: string | null
}

export default function ChatPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    const [newMessage, setNewMessage] = useState('')
    const [showScrollButton, setShowScrollButton] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null)
    const [initialScrollNeeded, setInitialScrollNeeded] = useState(true)

    const prevMessagesRef = useRef<Message[]>([])
    const hasSetFirstUnread = useRef(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null)
    const shouldScrollAfterSend = useRef(false)

    const messageLength = newMessage.length
    const isOverLimit = messageLength > CONTENT_LIMITS.MESSAGE
    const isNearLimit = messageLength > CONTENT_LIMITS.MESSAGE * 0.8
    const overBy = messageLength - CONTENT_LIMITS.MESSAGE

    // ── Query ۱: پیام‌ها ──
    const {
        data: messages = [],
        isLoading: loading,
        isError,
        error,
    } = useQuery<Message[]>({
        queryKey: ['messages', id],
        queryFn: async () => {
            const res = await fetch(`/api/conversations/${id}/messages`)
            if (!res.ok) throw new Error('خطا در دریافت پیام‌ها')
            const data = await res.json()
            return data.messages || []
        },
        enabled: !!id && !!user,
        refetchInterval: 3000,
        staleTime: 1000,
    })

    // ── Query ۲: اطلاعات کاربر مقابل ──
    const { data: conversationInfo } = useQuery({
        queryKey: ['conversation', id],
        queryFn: async () => {
            const res = await fetch(`/api/conversations/${id}`)
            if (!res.ok) throw new Error('خطا در دریافت اطلاعات گفتگو')
            return res.json()
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    })

    const otherUser: OtherUser | null = conversationInfo?.otherUser || null

    // ── Mutation: ارسال پیام ──
    const sendMessage = useMutation({
        mutationFn: async (content: string) => {
            const res = await fetch(`/api/conversations/${id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            })
            if (!res.ok) throw new Error('خطا در ارسال پیام')
            return res.json()
        },
        onSuccess: () => {
            setNewMessage('')
            shouldScrollAfterSend.current = true
            queryClient.invalidateQueries({ queryKey: ['messages', id] })
        },
    })

    // ── firstUnreadId فقط بار اول ──
    useEffect(() => {
        if (hasSetFirstUnread.current) return
        if (messages.length === 0 || !user) return
        const firstUnread = messages.find(
            (msg) => msg.senderId !== user.id && !msg.isRead
        )
        setFirstUnreadId(firstUnread?.id || null)
        hasSetFirstUnread.current = true
    }, [messages, user])

    // ── علامت‌گذاری خوانده‌شده ──
    useEffect(() => {
        if (id && user && firstUnreadId !== null) {
            fetch(`/api/conversations/${id}/read`, { method: 'POST' })
        }
    }, [id, user, firstUnreadId])

    // ── رهگیری پیام‌های جدید ──
    useEffect(() => {
        if (messages.length === 0) return
        if (prevMessagesRef.current.length === 0) {
            prevMessagesRef.current = messages
            return
        }
        const newFromOthers = messages.filter(
            (msg) =>
                msg.senderId !== user?.id &&
                !prevMessagesRef.current.some((prev) => prev.id === msg.id)
        )
        if (newFromOthers.length > 0) {
            const container = messagesContainerRef.current
            const nearBottom = container
                ? container.scrollHeight - container.scrollTop - container.clientHeight < 100
                : false
            if (!nearBottom) {
                setUnreadCount((prev) => prev + newFromOthers.length)
            } else {
                setUnreadCount(0)
            }
        }
        prevMessagesRef.current = messages
    }, [messages, user])

    // ── اسکرول اولیه (کاملاً ایزوله بدون پرش صفحه اصلی) ──
    useEffect(() => {
        if (!loading && initialScrollNeeded && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
            setInitialScrollNeeded(false)
        }
    }, [loading, messages, initialScrollNeeded])

    // ── اسکرول بعد از ارسال ──
    useEffect(() => {
        if (shouldScrollAfterSend.current && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior: 'smooth',
            })
            shouldScrollAfterSend.current = false
        }
    }, [messages])

    const handleScroll = () => {
        const container = messagesContainerRef.current
        if (!container) return
        const isNearBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight < 100
        setShowScrollButton(!isNearBottom)
        if (isNearBottom && unreadCount > 0) setUnreadCount(0)
    }

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
        setUnreadCount(0)
        setShowScrollButton(false)
    }

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || sendMessage.isPending || isOverLimit) return
        sendMessage.mutate(newMessage)
    }

    if (!user) {
        return (
            <main dir="rtl" className="h-full flex flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-red-50/30">
                <div className="w-20 h-20 rounded-3xl bg-white shadow-lg ring-1 ring-black/5 flex items-center justify-center rotate-3">
                    <FiMessageCircle className="w-9 h-9 text-red-300" />
                </div>
                <p className="text-gray-700 font-bold text-lg">برای مشاهده پیام‌ها وارد شوید</p>
                <Link href="/login" className="bg-red-600 text-white px-7 py-2.5 rounded-full font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-700 transition-all no-underline">
                    ورود به حساب
                </Link>
            </main>
        )
    }

    return (
        <main dir="rtl" className="relative h-full flex flex-col overflow-hidden bg-gradient-to-b from-gray-50 via-white to-red-50/30">
            <div className="fixed -top-24 -left-24 w-96 h-96 bg-red-100/40 rounded-full blur-3xl pointer-events-none animate-[bgFloat1_8s_ease-in-out_infinite]" />
            <div className="fixed -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/30 rounded-full blur-3xl pointer-events-none animate-[bgFloat2_10s_ease-in-out_infinite]" />

            <header className="shrink-0 z-30 bg-white/85 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        aria-label="بازگشت"
                        className="shrink-0 w-10 h-10 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center text-gray-600 transition-all cursor-pointer active:scale-90 group"
                    >
                        <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    {otherUser ? (
                        <Link
                            href={`/user/${otherUser.id}`}
                            className="flex items-center gap-2.5 min-w-0 flex-1 no-underline group/profile"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm ring-2 ring-white shadow-md overflow-hidden shrink-0 transition-all duration-200 group-hover/profile:scale-105 group-hover/profile:ring-red-200">
                                {otherUser.avatar ? (
                                    <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full object-cover" />
                                ) : (
                                    otherUser?.username?.charAt(0).toUpperCase() || '؟'
                                )}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-extrabold text-gray-900 leading-tight truncate transition-colors duration-200 group-hover/profile:text-red-600">
                                    {otherUser.name}
                                </h1>
                                <p className="text-[11px] text-gray-400 truncate" dir="ltr">
                                    @{otherUser.username}
                                </p>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="w-9 h-9 rounded-full bg-gray-200 ring-2 ring-white shadow-md overflow-hidden shrink-0 flex items-center justify-center text-gray-400 text-sm font-bold">
                                ؟
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base font-extrabold text-gray-900 leading-tight truncate">
                                    گفتگو
                                </h1>
                            </div>
                        </div>
                    )}

                    {messages.length > 0 && (
                        <span className="shrink-0 text-xs font-extrabold bg-red-50 text-red-600 ring-1 ring-red-100 px-2.5 py-1 rounded-full tabular-nums">
                            {messages.length}
                        </span>
                    )}
                </div>
            </header>

            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-6 relative">
                <div className="max-w-2xl mx-auto space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Spinner size="md" className='mt-25' />
                        </div>
                    ) : isError ? (
                        <div className="flex flex-col items-center py-16 text-center">
                            <div className="w-14 h-14 mb-3 rounded-2xl bg-red-50 ring-1 ring-red-100 flex items-center justify-center -rotate-3">
                                <FiMessageCircle className="w-6 h-6 text-red-300" />
                            </div>
                            <p className="text-gray-600 font-bold text-sm">
                                {(error as Error)?.message || 'خطا در دریافت پیام‌ها'}
                            </p>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center py-20 animate-[chatIn_0.5s_ease-out_both]">
                            <div className="relative w-fit mx-auto mb-5">
                                <div className="absolute inset-0 bg-red-100/60 rounded-full blur-2xl scale-125 pointer-events-none" />
                                <div className="relative w-[4.5rem] h-[4.5rem] rounded-[1.5rem] bg-white shadow-xl shadow-gray-200/60 ring-1 ring-black/5 flex items-center justify-center rotate-3">
                                    <FiMessageCircle className="w-8 h-8 text-gray-300" />
                                    <span className="absolute -bottom-2 -left-2 w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg flex items-center justify-center -rotate-6">
                                        <IoSend className="w-4 h-4 text-white" />
                                    </span>
                                </div>
                            </div>
                            <p className="text-gray-800 font-bold">هنوز پیامی رد و بدل نشده</p>
                            <p className="text-gray-400 text-sm mt-1">اولین پیام را بفرستید 👇</p>
                        </div>
                    ) : (
                        messages.map((message, index) => {
                            const isMine = message.senderId === user.id
                            const nextSame =
                                index < messages.length - 1 &&
                                messages[index + 1].senderId === message.senderId

                            if (message.pin) {
                                return (
                                    <Fragment key={message.id}>
                                        {message.id === firstUnreadId && (
                                            <div className="flex items-center gap-3 my-4">
                                                <span className="flex-1 h-px bg-gradient-to-l from-red-200 via-red-100 to-transparent" />
                                                <span className="shrink-0 text-xs font-bold text-red-500 bg-red-50 ring-1 ring-red-100 px-3 py-1 rounded-full">
                                                    پیام‌های جدید
                                                </span>
                                                <span className="flex-1 h-px bg-gradient-to-r from-red-200 via-red-100 to-transparent" />
                                            </div>
                                        )}

                                        <div
                                            className={`flex ${isMine ? 'justify-start' : 'justify-end'} animate-[chatIn_0.35s_ease-out_both]`}
                                            style={{ animationDelay: `${Math.min(index * 25, 250)}ms` }}
                                        >
                                            {/* ستون کارت + متا — بدون هیچ bubble و بدون قرمز */}
                                            <div className="flex flex-col gap-1 max-w-[80%] sm:max-w-[65%]">
                                                <SharedPinCard pin={message.pin} />
                                                <span className={`text-[10px] tabular-nums px-2 font-medium ${isMine ? 'text-red-400' : 'text-gray-400'}`}>
                                                    {new Date(message.createdAt).toLocaleTimeString('fa-IR', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </Fragment>
                                )
                            }
                            return (
                                <Fragment key={message.id}>
                                    {message.id === firstUnreadId && (
                                        <div className="flex items-center gap-3 my-4">
                                            <span className="flex-1 h-px bg-gradient-to-l from-red-200 via-red-100 to-transparent" />
                                            <span className="shrink-0 text-xs font-bold text-red-500 bg-red-50 ring-1 ring-red-100 px-3 py-1 rounded-full">
                                                پیام‌های جدید
                                            </span>
                                            <span className="flex-1 h-px bg-gradient-to-r from-red-200 via-red-100 to-transparent" />
                                        </div>
                                    )}
                                    <div
                                        className={`flex items-end gap-2 ${isMine ? 'justify-start' : 'justify-end'} ${isMine
                                            ? 'animate-[messagePopMine_0.35s_cubic-bezier(0.34,1.56,0.64,1)]'
                                            : 'animate-[messagePopTheirs_0.35s_cubic-bezier(0.34,1.56,0.64,1)]'
                                            }`}
                                        style={{ animationDelay: `${Math.min(index * 25, 250)}ms` }}
                                    >
                                        <div
                                            className={`relative max-w-[82%] sm:max-w-[70%] px-4 py-2.5 text-sm leading-relaxed shadow-md transition-all duration-200 ${isMine
                                                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-red-200/60 rounded-2xl rounded-br-md'
                                                : 'bg-white text-gray-800 ring-1 ring-gray-200/90 shadow-gray-200/50 rounded-2xl rounded-bl-md'
                                                }`}
                                        >
                                            {message.pin ? (
                                                <SharedPinCard pin={message.pin} />
                                            ) : (
                                                <p className="break-words whitespace-pre-wrap">{message.content}</p>
                                            )}
                                            <span className={`text-[10px] mt-1 block tabular-nums ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                                                {new Date(message.createdAt).toLocaleTimeString('fa-IR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>

                                        {!isMine && (
                                            <div className={`w-7 shrink-0 ${nextSame ? 'invisible' : ''}`}>
                                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-[10px] font-bold ring-2 ring-white overflow-hidden shadow-sm">
                                                    {message.sender?.avatar ? (
                                                        <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" loading="lazy" />
                                                    ) : (
                                                        message.sender?.username?.charAt(0).toUpperCase() || '؟'
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </Fragment>
                            )
                        })
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            </div>

            {(showScrollButton || unreadCount > 0) && (
                <button
                    onClick={scrollToBottom}
                    aria-label="پایین"
                    className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-40 w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${unreadCount > 0
                        ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-300/50 hover:shadow-xl hover:shadow-red-400/60 hover:scale-110 active:scale-95'
                        : 'bg-white text-gray-600 shadow-lg ring-1 ring-black/5 hover:bg-gray-50 hover:scale-110 active:scale-95'
                        } animate-[bounceSmooth_1.2s_ease-in-out_infinite]`}
                >
                    {unreadCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 flex">
                            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold items-center justify-center shadow-md ring-2 ring-white">
                                {unreadCount > 99 ? '۹۹+' : unreadCount}
                            </span>
                        </span>
                    )}
                    <FiChevronDown className="w-5 h-5" />
                </button>
            )}

            <footer className="shrink-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <form
                    onSubmit={handleSend}
                    className="max-w-2xl mx-auto px-3 sm:px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
                >
                    <div className="flex items-center gap-2.5">
                        {/* دکمه ارسال */}
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sendMessage.isPending || isOverLimit}
                            aria-label="ارسال پیام"
                            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${newMessage.trim() && !sendMessage.isPending && !isOverLimit
                                ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-300/60 hover:shadow-xl hover:-translate-y-0.5 active:scale-90'
                                : 'bg-gray-200/80 text-gray-400 cursor-not-allowed scale-95'
                                }`}
                        >
                            {sendMessage.isPending ? (
                                <Spinner size="md" />
                            ) : (
                                <IoSend className="w-5 h-5" />
                            )}
                        </button>

                        {/* input + counter */}
                        <div className="relative flex-1 min-w-0">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="پیام خود را بنویسید..."
                                className={`w-full bg-gray-100 ring-1 rounded-xl px-5 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all duration-200 ${isOverLimit
                                    ? 'ring-red-300 focus:ring-red-400'
                                    : 'ring-gray-200/70 focus:ring-red-300/60 pl-18'
                                    }`}
                            />

                            {/* پیل شمارنده */}
                            {newMessage.length > 0 && (
                                <span
                                    className={`absolute left-2.5 top-1/2 -translate-y-1/2 inline-flex items-center gap-0.5 h-6 px-2 rounded-full text-[10px] font-bold tabular-nums transition-all duration-200 ${isOverLimit
                                        ? 'bg-red-100 text-red-600 ring-1 ring-red-300 animate-pulse'
                                        : isNearLimit
                                            ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200'
                                            : 'bg-gray-200/80 text-gray-500'
                                        }`}
                                >
                                    <span>{messageLength}</span>
                                    <span className="opacity-40">/</span>
                                    <span className="opacity-60">{CONTENT_LIMITS.MESSAGE}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* پیام خطا */}
                    {isOverLimit && (
                        <div className="mt-2 mr-14 flex items-center gap-1.5 text-[11px] text-red-500 font-medium animate-[slideDown_0.2s_ease-out]">
                            <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                {overBy} کاراکتر بیشتر از حد مجاز نوشتی. لطفاً کوتاهش کن.
                            </span>
                        </div>
                    )}
                </form>
            </footer>

            <style>{`
                @keyframes chatIn {
                    from { opacity: 0; transform: translateY(10px) scale(0.97); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes messagePopMine {
                    0% { opacity: 0; transform: translateX(20px) scale(0.9); }
                    100% { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes messagePopTheirs {
                    0% { opacity: 0; transform: translateX(-20px) scale(0.9); }
                    100% { opacity: 1; transform: translateX(0) scale(1); }
                }
                @keyframes sendPop {
                    0% { transform: scale(0.5) rotate(-15deg); }
                    60% { transform: scale(1.2) rotate(5deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes bgFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(20px, 15px) scale(1.1); }
                }
                @keyframes bgFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(-25px, -20px) scale(1.15); }
                }
                @keyframes bounceSmooth {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}