"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiTrash2 } from 'react-icons/fi'

type Props = {
    pinId: string
    onClose: () => void
    onDeleteSuccess: (pinId: string) => void
}

export default function DeletePinModal({ pinId, onClose, onDeleteSuccess }: Props) {
    const [mounted, setMounted] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        setMounted(true)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [])

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/pins/${pinId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('خطا در حذف پین')
            onDeleteSuccess(pinId)
            onClose()
        } catch (error) {
            console.error(error)
            setIsDeleting(false)
            onClose()
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
                className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center animate-[scaleUp_0.2s_ease-out] my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-14 h-14 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                    <FiTrash2 className="text-red-600 text-xl" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">حذف پین</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    آیا مطمئن هستید که می‌خواهید این پین را حذف کنید؟
                </p>
                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-200"
                    >
                        {isDeleting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                                <span>در حال حذف...</span>
                            </>
                        ) : (
                            <span>حذف</span>
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
