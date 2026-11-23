"use client"

import React, { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { FiFlag, FiX } from "react-icons/fi"

type ReportPinModalProps = {
    pinId: string
    onClose: () => void
    onReported?: () => void
}

const REASONS = [
    { value: 'spam', label: 'اسپم یا تبلیغات' },
    { value: 'inappropriate', label: 'محتوای نامناسب یا مستهجن' },
    { value: 'violence', label: 'خشونت یا محتوای آزاردهنده' },
    { value: 'hate', label: 'نفرت‌پراکنی یا نمادهای توهین‌آمیز' },
    { value: 'misinformation', label: 'اطلاعات نادرست یا گمراه‌کننده' },
    { value: 'other', label: 'سایر' },
] as const

const ReportPinModal = ({ pinId, onClose, onReported }: ReportPinModalProps) => {
    const [mounted, setMounted] = useState(false)
    const [reason, setReason] = useState<string>('')
    const [description, setDescription] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        setMounted(true)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [])

    const handleSubmit = async () => {
        if (!reason) return

        setIsSubmitting(true)
        setError('')

        try {
            const res = await fetch(`/api/pins/${pinId}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason, description: description || undefined }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ثبت گزارش')
            }

            onReported?.()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setIsSubmitting(false)
        }
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
                className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-[scaleUp_0.2s_ease-out] my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <FiFlag className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">گزارش پین</h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <p className="text-sm text-gray-500 mb-4">دلیل گزارش خود را انتخاب کنید:</p>

                <div className="space-y-1.5 mb-4">
                    {REASONS.map((r) => {
                        const isSelected = reason === r.value
                        return (
                            <button
                                key={r.value}
                                type="button"
                                onClick={() => setReason(r.value)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-right text-sm font-medium transition-all cursor-pointer
                            ${isSelected
                                        ? 'bg-red-50 text-red-700 ring-1 ring-red-300'
                                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center transition-all
                            ${isSelected ? 'bg-red-600' : 'border-2 border-gray-300'}`}>
                                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                                </span>
                                {r.label}
                            </button>
                        )
                    })}
                </div>

                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="توضیح بیشتر (اختیاری)..."
                    rows={3}
                    maxLength={500}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all resize-none mb-5"
                />

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!reason || isSubmitting}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-200"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                <span>در حال ارسال...</span>
                            </>
                        ) : (
                            <span>ثبت گزارش</span>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>

                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}

export default ReportPinModal
