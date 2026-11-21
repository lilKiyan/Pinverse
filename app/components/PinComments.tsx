"use client"

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/lib/authStore'
import { CONTENT_LIMITS } from '@/lib/validations'
import type { CommentDTO } from '../types/pinComment'
import Spinner from '@/app/components/Spinner'

import {
    FiMessageCircle,
    FiTrash2,
    FiSend,
    FiAlertCircle,
} from 'react-icons/fi'

type PinCommentsProps = {
    pinId: string
    onRequireLogin?: () => void
}


export default function PinComments({ pinId, onRequireLogin }: PinCommentsProps) {
    const { user } = useAuthStore()
    const [comments, setComments] = useState<CommentDTO[]>([])
    const [newComment, setNewComment] = useState('')
    const [loadingComments, setLoadingComments] = useState(true)
    const [commentError, setCommentError] = useState('')

    const [commentToDelete, setCommentToDelete] = useState<CommentDTO | null>(null)
    const [isModalClosing, setIsModalClosing] = useState(false)

    const commentLength = newComment.length
    const isOverLimit = commentLength > CONTENT_LIMITS.COMMENT
    const isNearLimit = commentLength > CONTENT_LIMITS.COMMENT * 0.8
    const overBy = commentLength - CONTENT_LIMITS.COMMENT

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await fetch(`/api/pins/${pinId}/comments`)
                if (res.ok) {
                    const data = await res.json()
                    setComments(data.comments || [])
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoadingComments(false)
            }
        }
        if (pinId) fetchComments()
    }, [pinId])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            onRequireLogin?.()
            return
        }

        if (!newComment.trim()) return

        if (isOverLimit) {
            setCommentError(`کامنت نمی‌تواند بیش از ${CONTENT_LIMITS.COMMENT} کاراکتر باشد`)
            return
        }

        setCommentError('')
        try {
            const res = await fetch(`/api/pins/${pinId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ثبت کامنت')
            }
            const data = await res.json()
            setComments(prev => [data.comment, ...prev])
            setNewComment('')
        } catch (err) {
            setCommentError(err instanceof Error ? err.message : 'خطا')
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        try {
            const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
            if (res.ok) {
                setComments(prev => prev.filter(c => c.id !== commentId))
            }
        } catch (error) {
            console.error(error)
        }
    }

    const timeAgo = (date: string | Date) => {
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
        if (seconds < 60) return 'همین حالا'
        const minutes = Math.floor(seconds / 60)
        if (minutes < 60) return `${minutes} دقیقه پیش`
        const hours = Math.floor(minutes / 60)
        if (hours < 24) return `${hours} ساعت پیش`
        const days = Math.floor(hours / 24)
        if (days < 7) return `${days} روز پیش`
        const weeks = Math.floor(days / 7)
        if (weeks < 5) return `${weeks} هفته پیش`
        return new Date(date).toLocaleDateString('fa-IR')
    }

    const openDeleteCommentModal = (comment: CommentDTO) => {
        setCommentToDelete(comment)
        setIsModalClosing(false)
    }

    const closeDeleteCommentModal = () => {
        setIsModalClosing(true)
        setTimeout(() => {
            setCommentToDelete(null)
            setIsModalClosing(false)
        }, 200)
    }

    const confirmDeleteComment = async () => {
        if (!commentToDelete) return
        await handleDeleteComment(commentToDelete.id)
        closeDeleteCommentModal()
    }

    return (
        <div className="px-4 sm:px-5 py-3 flex flex-col gap-3">
            {/* هدر */}
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-50 ring-1 ring-gray-100 flex items-center justify-center shrink-0">
                    <FiMessageCircle className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-gray-900">دیدگاه‌ها</h2>
                <span className="text-[11px] font-extrabold bg-red-50 text-red-600 ring-1 ring-red-100 px-1.5 py-0.5 rounded-full tabular-nums">
                    {comments.length}
                </span>
                <div className="flex-1 h-px bg-gradient-to-l from-gray-100 to-transparent" />
            </div>

            {/* لیست کامنت‌ها */}
            {loadingComments ? (
                <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                </div>
            ) : comments.length === 0 ? (
                <div className="text-center py-6">
                    <div className="w-12 h-12 mx-auto mb-2.5 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-100 flex items-center justify-center rotate-3">
                        <FiMessageCircle className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-bold text-gray-600">اولین دیدگاه را شما بنویسید</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">نظر شما به این پین جان می‌دهد!</p>
                </div>
            ) : (
                <div className="relative">
                    <div className="pointer-events-none absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-white to-transparent z-10 rounded-t-xl" />
                    <div className="pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-b from-transparent to-white z-10 rounded-b-xl" />

                    <div className="space-y-1.5 max-h-[35vh] md:max-h-[42vh] overflow-y-auto scroll-smooth px-0.5 py-1.5
                        [&::-webkit-scrollbar]:w-1.5
                        [&::-webkit-scrollbar-thumb]:bg-gray-200
                        [&::-webkit-scrollbar-thumb]:hover:bg-gray-300
                        [&::-webkit-scrollbar-thumb]:rounded-full
                        [&::-webkit-scrollbar-track]:bg-transparent">

                        {comments.map((comment, index) => {
                            const isMine = user && comment.userId === user.id
                            return (
                                <div
                                    key={comment.id}
                                    className="group/comment flex items-start gap-2.5 p-1.5 rounded-xl hover:bg-gray-50/70 transition-all duration-200 animate-[commentIn_0.35s_ease-out_backwards]"
                                    style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
                                >
                                    <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-600 text-xs font-bold ring-2 ring-white shadow-sm">
                                        {comment.user?.avatar ? (
                                            <Image
                                                src={comment.user.avatar}
                                                alt=""
                                                width={32}
                                                height={32}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            comment.user?.username?.charAt(0).toUpperCase() || '؟'
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div
                                            className={`rounded-xl sm:rounded-2xl px-3 py-2 ring-1 transition-all duration-200 ${isMine
                                                ? 'bg-gradient-to-br from-red-50/80 to-rose-50/50 ring-red-100/80'
                                                : 'bg-gray-50/80 ring-gray-100 group-hover/comment:bg-white group-hover/comment:ring-gray-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[11px] font-extrabold truncate ${isMine ? 'text-red-700' : 'text-gray-900'}`}>
                                                    {comment.user?.name || comment.user?.username || 'کاربر'}
                                                </span>
                                                {isMine && (
                                                    <span className="shrink-0 text-[9px] font-bold bg-red-100 text-red-600 px-1 py-0.2 rounded">
                                                        شما
                                                    </span>
                                                )}
                                                <span className="ml-auto flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-gray-400">
                                                        {timeAgo(comment.createdAt)}
                                                    </span>
                                                    {isMine && (
                                                        <button
                                                            onClick={() => openDeleteCommentModal(comment)}
                                                            title="حذف کامنت"
                                                            aria-label="حذف کامنت"
                                                            className="w-5 h-5 rounded flex items-center justify-center text-gray-400 opacity-100 sm:opacity-0 sm:group-hover/comment:opacity-100 hover:text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer active:scale-90"
                                                        >
                                                            <FiTrash2 className="w-2.5 h-2.5" />
                                                        </button>
                                                    )}
                                                </span>
                                            </div>

                                            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed break-words whitespace-pre-wrap">
                                                {comment.content}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* فرم افزودن دیدگاه */}
            <div className="flex items-start gap-2.5 mt-0.5">
                <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white shadow-sm shadow-red-100">
                    {user?.avatar ? (
                        <Image src={user.avatar} alt="" className="w-full h-full object-cover" width={32} height={32} />
                    ) : (
                        user?.username?.charAt(0).toUpperCase() || '؟'
                    )}
                </div>

                <div className="flex-1">
                    <form onSubmit={handleAddComment} className="relative group/input">
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newComment.trim() && !isOverLimit) {
                                    e.preventDefault()
                                    handleAddComment(e)
                                }
                            }}
                            placeholder="دیدگاه خود را بنویسید..."
                            className={`w-full bg-gray-50 ring-1 rounded-full pr-3.5 pl-24 md:pl-28 py-2 text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 transition-all duration-200 ${isOverLimit
                                ? 'ring-red-300 focus:ring-red-400'
                                : 'ring-gray-200/70 focus:ring-red-300/60'
                                }`}
                        />

                        <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                            {/* پیل شمارنده */}
                            {newComment.length > 0 && (
                                <span
                                    className={`inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full text-[9px] font-bold tabular-nums transition-all duration-200 ${isOverLimit
                                        ? 'bg-red-100 text-red-600 ring-1 ring-red-300 animate-pulse'
                                        : isNearLimit
                                            ? 'bg-orange-100 text-orange-600 ring-1 ring-orange-200'
                                            : 'bg-gray-200/80 text-gray-500'
                                        }`}
                                >
                                    <span>{commentLength}</span>
                                    <span className="opacity-40">/</span>
                                    <span className="opacity-60">{CONTENT_LIMITS.COMMENT}</span>
                                </span>
                            )}

                            <button
                                type="submit"
                                disabled={!newComment.trim() || isOverLimit}
                                aria-label="ارسال کامنت"
                                className={`h-7 px-3 rounded-full flex items-center gap-1 text-[11px] font-bold transition-all duration-200 cursor-pointer ${newComment.trim() && !isOverLimit
                                    ? 'bg-gradient-to-l from-red-500 to-rose-600 text-white shadow-sm shadow-red-200 hover:shadow-md hover:brightness-105 active:scale-95'
                                    : 'bg-gray-200/80 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                ارسال
                                <FiSend className="w-2.5 h-2.5 -scale-x-100" />
                            </button>
                        </div>
                    </form>

                    {/* پیام خطا */}
                    {isOverLimit && (
                        <div className="mt-1.5 mr-2 flex items-center gap-1.5 text-[11px] text-red-500 font-medium animate-[slideDown_0.2s_ease-out]">
                            <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                {overBy} کاراکتر بیشتر از حد مجاز نوشتی.
                            </span>
                        </div>
                    )}

                    {/* خطای سرور */}
                    {commentError && !isOverLimit && (
                        <p className="mt-1.5 mr-2 text-[11px] text-red-500 font-medium">
                            {commentError}
                        </p>
                    )}
                </div>
            </div>

            {/* مودال تأیید حذف */}
            {commentToDelete && (
                <div
                    className={`fixed inset-0 z-[150] flex items-center justify-center p-4 ${isModalClosing
                        ? 'animate-[fadeOut_0.2s_ease-in]'
                        : 'animate-[fadeIn_0.2s_ease-out]'
                        }`}
                >
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeDeleteCommentModal} />

                    <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-[285px] md:max-w-sm text-center">
                        <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                            <FiTrash2 className="text-red-600 text-xl" />
                        </div>
                        <h3 className="text-md md:text-lg font-bold text-gray-900 mb-1.5">حذف دیدگاه</h3>
                        <p className="text-gray-500 text-xs md:text-sm leading-relaxed mb-6">
                            آیا مطمئن هستید که می‌خواهید این دیدگاه را حذف کنید؟ این عمل قابل بازگشت نیست.
                        </p>
                        <div className="flex gap-2.5">
                            <button
                                onClick={closeDeleteCommentModal}
                                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={confirmDeleteComment}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes commentIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
        </div>
    )
}