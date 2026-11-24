"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiAlertTriangle, FiTrash2 } from 'react-icons/fi'

type AdminPinDeleteModalProps = {
    pin: {
        id: string
        title: string
        imageUrl: string
        user?: { username: string; name: string }
    }
    onClose: () => void
    onDeleted: (message: string) => void
}

export default function AdminPinDeleteModal({
    pin,
    onClose,
    onDeleted,
}: AdminPinDeleteModalProps) {
    const [mounted, setMounted] = useState(false)
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
            const res = await fetch(`/api/admin/pins/${pin.id}`, { method: 'DELETE' })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'خطا در حذف پین')
            }

            onDeleted(data.message || 'پین با موفقیت حذف شد')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در حذف پین')
            setDeleting(false)
        }
    }

    if (!mounted) return null

    const modalContent = (
        <div
            dir="rtl"
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl ring-1 ring-black/10 space-y-5 animate-[scaleIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    disabled={deleting}
                    aria-label="بستن"
                    className="absolute top-5 left-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                    <FiX className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3.5 pl-8">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm shrink-0">
                        <FiAlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900">
                            حذف پین توسط مدیر
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            آیا مطمئن هستید که می‌خواهید این پین را به طور کامل حذف کنید؟
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                        {error}
                    </div>
                )}

                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                        <img src={pin.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-sm text-gray-900 truncate">
                            {pin.title}
                        </p>
                        {pin.user && (
                            <p className="text-xs text-right text-gray-400 truncate mt-0.5" dir="ltr">
                                @{pin.user.username}
                            </p>
                        )}
                    </div>
                </div>

                <p className="text-xs text-gray-500 leading-relaxed">
                    با حذف این پین، تمام لایک‌ها، ذخیره‌ها، کامنت‌ها و گزارش‌های مربوط به آن پاک خواهند شد.
                </p>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                        {deleting ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>در حال حذف...</span>
                            </>
                        ) : (
                            <>
                                <FiTrash2 className="w-3.5 h-3.5" />
                                <span>حذف قطعی پین</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
