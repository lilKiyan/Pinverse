"use client"

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
    FiShare2,
    FiX,
    FiSearch,
    FiSend,
    FiCheck,
    FiLink,
    FiUsers,
    FiMessageCircle,
} from 'react-icons/fi'

type ShareTarget = {
    id: string
    name: string
    username: string
    avatar: string | null
}

type ShareTargetsResponse = {
    chats: ShareTarget[]
    followed: ShareTarget[]
}

type SharePinModalProps = {
    pinId: string
    pinTitle: string
    pinImageUrl: string
    onClose: () => void
}

export default function SharePinModal({
    pinId,
    pinTitle,
    pinImageUrl,
    onClose,
}: SharePinModalProps) {
    const [query, setQuery] = useState('')
    const [sentIds, setSentIds] = useState<Set<string>>(new Set())
    const [copied, setCopied] = useState(false)
    const [error, setError] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [])

    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [debouncedQuery, setDebouncedQuery] = useState('')

    useEffect(() => {
        if (searchTimer.current) clearTimeout(searchTimer.current)
        const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
        return () => clearTimeout(t)
    }, [query])

    const {
        data: targets,
        isLoading: loadingTargets,
    } = useQuery<ShareTargetsResponse>({
        queryKey: ['share-targets', debouncedQuery],
        queryFn: async () => {
            const q = debouncedQuery ? `?q=${encodeURIComponent(debouncedQuery)}` : ''
            const res = await fetch(`/api/pins/share-targets${q}`)
            if (!res.ok) throw new Error('خطا در دریافت مخاطبین')
            return res.json()
        },
        staleTime: 30 * 1000,
    })

    const shareMutation = useMutation({
        mutationFn: async (recipientIds: string[]) => {
            const res = await fetch(`/api/pins/${pinId}/share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientIds }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ارسال')
            }
            return res.json()
        },
        onError: (err: Error) => setError(err.message),
    })

    const handleShare = (target: ShareTarget) => {
        setError('')
        shareMutation.mutate([target.id], {
            onSuccess: () => {
                setSentIds((prev) => new Set(prev).add(target.id))
            },
        })
    }

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/pin/${pinId}`

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url)
        } else {
            const textarea = document.createElement('textarea')
            textarea.value = url
            textarea.style.position = 'fixed'
            textarea.style.opacity = '0'
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
        }

        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onClose])

    const chats = targets?.chats ?? []
    const followed = targets?.followed ?? []
    const isSearching = debouncedQuery.length > 0

    const renderTargetRow = (target: ShareTarget) => {
        const isSent = sentIds.has(target.id)
        return (
            <div
                key={target.id}
                className="flex items-center mb-0 gap-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold shrink-0">
                    {target.avatar ? (
                        <Image
                            src={target.avatar}
                            alt={target.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        target.username?.charAt(0).toUpperCase()
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{target.name}</p>
                    <p className="text-xs text-right text-gray-400 truncate" dir="ltr">@{target.username}</p>
                </div>

                <button
                    onClick={() => handleShare(target)}
                    disabled={isSent || shareMutation.isPending}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95
                        ${isSent
                            ? 'bg-green-50 text-green-600 ring-1 ring-green-200 cursor-default'
                            : 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200/60'
                        } disabled:opacity-60`}
                >
                    {isSent ? (
                        <>
                            <FiCheck className="w-3.5 h-3.5" />
                            ارسال شد
                        </>
                    ) : shareMutation.isPending ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            <FiSend className="w-3.5 h-3.5 -scale-x-100" />
                            ارسال
                        </>
                    )}
                </button>
            </div>
        )
    }

    if (!mounted) return null

    const modalContent = (
        <div
            className="fixed inset-0 z-[99999] w-screen h-screen min-h-dvh bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                dir="rtl"
                className="bg-white rounded-3xl shadow-2xl ring-1 ring-black/5 w-full max-w-md overflow-hidden animate-[scaleUp_0.2s_ease-out] my-auto"
                onClick={(e) => e.stopPropagation()}
            >

                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                            <FiShare2 className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-base font-bold text-gray-900">اشتراک‌گذاری پین</h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-5 py-4 flex items-center gap-3 bg-gradient-to-l from-red-50/60 to-transparent border-b border-gray-50">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-black/5 shrink-0 bg-gray-100">
                        <Image
                            src={pinImageUrl}
                            alt={pinTitle}
                            fill
                            sizes="48px"
                            className="object-cover"
                        />
                    </div>
                    <p className="flex-1 text-sm font-bold text-gray-800 truncate">{pinTitle}</p>
                    <button
                        onClick={handleCopyLink}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer active:scale-95
                            ${copied
                                ? 'bg-green-50 text-green-600 ring-1 ring-green-200'
                                : 'bg-gray-900 text-white hover:bg-black shadow-md'
                            }`}
                    >
                        {copied ? (
                            <>
                                <FiCheck className="w-3.5 h-3.5" />
                                کپی شد
                            </>
                        ) : (
                            <>
                                <FiLink className="w-3.5 h-3.5" />
                                کپی لینک
                            </>
                        )}
                    </button>
                </div>

                <div className="px-5 pt-4 pb-2">
                    <div className="relative">
                        <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="جستجوی مخاطب..."
                            autoFocus
                            className="w-full bg-gray-50 ring-1 ring-gray-200/70 rounded-full pr-10 pl-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-300/60 transition-all"
                        />
                    </div>
                </div>

                {error && (
                    <div className="mx-5 mb-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">
                        {error}
                    </div>
                )}

                <div className="max-h-[320px] overflow-y-auto px-2 pb-3
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-thumb]:bg-gray-200
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-transparent">

                    {loadingTargets ? (
                        <div className="flex justify-center py-10">
                            <div className="w-6 h-6 border-[3px] border-gray-200 border-t-red-500 rounded-full animate-spin" />
                        </div>
                    ) : isSearching ? (
                        <>
                            <SectionTitle icon={<FiUsers className="w-3 h-3" />} label="نتایج" />
                            {chats.length + followed.length === 0 ? (
                                <p className="px-4 py-8 text-center text-sm text-gray-400">
                                    مخاطبی با این نام پیدا نشد
                                </p>
                            ) : (
                                <>
                                    {chats.map(renderTargetRow)}
                                    {followed.map(renderTargetRow)}
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {chats.length > 0 && (
                                <>
                                    <SectionTitle
                                        icon={<FiMessageCircle className="w-3 h-3" />}
                                        label="چت‌های اخیر"
                                    />
                                    {chats.map(renderTargetRow)}
                                </>
                            )}

                            {followed.length > 0 && (
                                <>
                                    <SectionTitle
                                        icon={<FiUsers className="w-3 h-3" />}
                                        label="دنبال‌شده‌ها"
                                    />
                                    {followed.map(renderTargetRow)}
                                </>
                            )}

                            {chats.length + followed.length === 0 && (
                                <div className="px-4 py-10 text-center">
                                    <p className="text-sm text-gray-500 font-bold">هنوز مخاطبی نداری</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        کسی را دنبال کن یا با او گفتگو شروع کن تا اینجا ظاهر شود
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
            <span className="w-5 h-5 rounded-md bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                {icon}
            </span>
            <span className="text-[11px] font-extrabold text-gray-500 tracking-wide">{label}</span>
            <div className="flex-1 h-px bg-gradient-to-l from-gray-100 to-transparent" />
        </div>
    )
}