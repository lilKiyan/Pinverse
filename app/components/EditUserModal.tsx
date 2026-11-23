"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiSave, FiAlertCircle } from 'react-icons/fi'

type EditUserModalProps = {
    userId: string
    initialName: string
    initialUsername: string
    initialBio: string | null
    onClose: () => void
    onSaved: (message: string) => void
}

export default function EditUserModal({
    userId,
    initialName,
    initialUsername,
    initialBio,
    onClose,
    onSaved,
}: EditUserModalProps) {
    const [mounted, setMounted] = useState(false)
    const [name, setName] = useState(initialName)
    const [username, setUsername] = useState(initialUsername)
    const [bio, setBio] = useState(initialBio || '')
    const [newPassword, setNewPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        setMounted(true)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [])

    const handleSave = async () => {
        if (saving) return
        setSaving(true)
        setError('')

        try {
            const body: Record<string, string> = {}

            if (name.trim() !== initialName) body.name = name.trim()
            if (username.trim() !== initialUsername) body.username = username.trim()
            if (bio.trim() !== (initialBio || '')) body.bio = bio
            if (newPassword) body.newPassword = newPassword

            if (Object.keys(body).length === 0) {
                onClose()
                return
            }

            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ذخیره')
            }

            const data = await res.json()
            onSaved(data.message || 'کاربر به‌روزرسانی شد')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setSaving(false)
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
                    <h2 className="text-lg font-bold text-gray-900">ویرایش کاربر</h2>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                        <FiAlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            نام کامل
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            نام کاربری
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            dir="ltr"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all text-left"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            بیوگرافی
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                            maxLength={160}
                            placeholder="درباره این کاربر..."
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                            پسورد جدید <span className="text-gray-400 font-normal">(اختیاری — موقت برای کاربر)</span>
                        </label>
                        <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            dir="ltr"
                            placeholder="خالی = بدون تغییر"
                            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all text-left"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5">
                            پسورد جدید را به کاربر اطلاع دهید تا از تنظیمات عوضش کند
                        </p>
                    </div>
                </div>

                <div className="flex gap-2.5 mt-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-red-200"
                    >
                        {saving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                                <span>در حال ذخیره...</span>
                            </>
                        ) : (
                            <>
                                <FiSave className="w-4 h-4" />
                                <span>ذخیره</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
