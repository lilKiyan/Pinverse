"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiTrash2 } from 'react-icons/fi'

type Board = {
    id: string
    name: string
}

type Props = {
    board: Board
    onClose: () => void
    onDeleted: (boardId: string) => void
}

export default function DeleteBoardModal({ board, onClose, onDeleted }: Props) {
    const [mounted, setMounted] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
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
        if (isDeleting) return
        setIsDeleting(true)
        setError('')
        try {
            const res = await fetch(`/api/boards/${board.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('خطا در حذف برد')
            onDeleted(board.id)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
            setIsDeleting(false)
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
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">حذف برد</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                    آیا مطمئنی می‌خوای برد «{board.name}» رو حذف کنی؟ این عمل قابل بازگشت نیست.
                </p>

                {error && (
                    <p className="text-red-500 text-xs mb-3">{error}</p>
                )}

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>
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
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
