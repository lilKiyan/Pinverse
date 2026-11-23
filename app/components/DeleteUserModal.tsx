"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi'

type DeleteUserModalProps = {
    userId: string
    username: string
    pinCount: number
    onClose: () => void
    onDeleted: (message: string) => void
}

export default function DeleteUserModal({
    userId,
    username,
    pinCount,
    onClose,
    onDeleted,
}: DeleteUserModalProps) {
    const [mounted, setMounted] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)
    const [confirmText, setConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        setMounted(true)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [])

    const handleDelete = async () => {
        setDeleting(true)
        setError('')

        try {
            const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در حذف')
            }

            const data = await res.json()
            onDeleted(data.message)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
            setDeleting(false)
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
                <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                    <FiAlertTriangle className="text-red-600 text-xl" />
                </div>

                {step === 1 ? (
                    <>
                        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
                            حذف کاربر @{username}
                        </h2>
                        <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
                            این عملیات <span className="font-bold text-red-600">برگشت‌ناپذیر</span> است و
                            همه‌ی داده‌های این کاربر برای همیشه حذف می‌شود:
                        </p>

                        <div className="bg-red-50/60 rounded-2xl p-4 mb-5 space-y-1.5">
                            {[
                                `${pinCount.toLocaleString('fa-IR')} پین منتشرشده`,
                                'همه‌ی کامنت‌ها، لایک‌ها و سیوها',
                                'همه‌ی گفتگوها و پیام‌ها',
                                'فالو‌ها و اعلان‌ها',
                            ].map((item) => (
                                <p key={item} className="flex items-center gap-2 text-xs text-red-700/80">
                                    <FiAlertTriangle className="w-3 h-3 shrink-0" />
                                    {item}
                                </p>
                            ))}
                        </div>

                        <div className="flex gap-2.5">
                            <button
                                onClick={onClose}
                                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                فهمیدم، ادامه
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-lg font-bold text-gray-900 text-center mb-2">
                            تأیید نهایی
                        </h2>
                        <p className="text-sm text-gray-500 text-center leading-relaxed mb-4">
                            برای تأیید حذف <span className="font-bold text-red-600">@{username}</span>،
                            کلمه‌ی
                            <span className="inline-block mx-1 px-2 py-0.5 bg-red-50 text-red-600 font-bold rounded-md">
                                حذف
                            </span>
                            را تایپ کنید.
                        </p>

                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="حذف"
                            dir="rtl"
                            autoFocus
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-gray-900 placeholder-gray-300 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all mb-4"
                        />

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-2.5">
                            <button
                                onClick={() => {
                                    setStep(1)
                                    setConfirmText('')
                                }}
                                className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                            >
                                بازگشت
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={confirmText !== 'حذف' || deleting}
                                className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                            >
                                {deleting ? (
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <FiTrash2 className="w-4 h-4" />
                                )}
                                حذف قطعی
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}