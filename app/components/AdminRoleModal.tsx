"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FiX, FiShield, FiCheck, FiUserCheck, FiUsers } from 'react-icons/fi'

type AdminRoleModalProps = {
    user: {
        id: string
        name: string
        username: string
        avatar?: string | null
        roles?: { role: { name: string; description?: string | null } }[]
    }
    onClose: () => void
    onRoleUpdated: (roleName: string, message: string) => void
}

const AVAILABLE_ROLES = [
    {
        name: 'admin',
        title: 'مدیر ارشد (Admin)',
        description: 'دسترسی کامل به کل پنل ادمین، مدیریت کاربران، نقش‌ها، گزارش‌ها و دسته‌بندی‌ها',
        color: 'from-red-500 to-rose-600',
        badgeBg: 'bg-red-50 text-red-600 ring-red-200',
        icon: FiShield,
    },
    {
        name: 'moderator',
        title: 'ناظر محتوا (Moderator)',
        description: 'دسترسی به بررسی گزارش‌ها، حذف پین‌های نامناسب و بررسی تخلفات (بدون مدیریت کاربران)',
        color: 'from-blue-500 to-indigo-600',
        badgeBg: 'bg-blue-50 text-blue-600 ring-blue-200',
        icon: FiUserCheck,
    },
    {
        name: 'user',
        title: 'کاربر عادی (User)',
        description: 'کاربر معمولی سایت بدون هیچ‌گونه دسترسی به پنل مدیریت یا ابزارهای نظارتی',
        color: 'from-gray-500 to-slate-600',
        badgeBg: 'bg-gray-100 text-gray-700 ring-gray-200',
        icon: FiUsers,
    },
] as const

export default function AdminRoleModal({
    user,
    onClose,
    onRoleUpdated,
}: AdminRoleModalProps) {
    const [mounted, setMounted] = useState(false)
    const currentRoleName = user.roles && user.roles.length > 0 ? user.roles[0].role.name : 'user'
    const [selectedRole, setSelectedRole] = useState<string>(currentRoleName)
    const [loading, setLoading] = useState(false)
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
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/admin/users/${user.id}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roleName: selectedRole }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'خطا در تغییر نقش کاربر')
            }

            onRoleUpdated(selectedRole, data.message || 'نقش کاربر با موفقیت تغییر کرد')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در تغییر نقش')
            setLoading(false)
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
                className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-7 shadow-2xl ring-1 ring-black/10 space-y-5 animate-[scaleIn_0.2s_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* دکمه بستن */}
                <button
                    onClick={onClose}
                    disabled={loading}
                    aria-label="بستن"
                    className="absolute top-5 left-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
                >
                    <FiX className="w-4 h-4" />
                </button>

                {/* هدر مودال */}
                <div className="flex items-center gap-3.5 pl-8">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-red-200 shrink-0">
                        <FiShield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900">
                            مدیریت و تعیین نقش کاربر
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            تعیین سطح دسترسی برای <span className="font-bold text-gray-800">@{user.username}</span> ({user.name})
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold">
                        {error}
                    </div>
                )}

                {/* انتخاب نقش‌ها */}
                <div className="space-y-3 pt-1">
                    <label className="block text-xs font-bold text-gray-700">
                        نقش مورد نظر را انتخاب کنید:
                    </label>

                    {AVAILABLE_ROLES.map((r) => {
                        const Icon = r.icon
                        const isSelected = selectedRole === r.name
                        const isCurrent = currentRoleName === r.name

                        return (
                            <button
                                key={r.name}
                                type="button"
                                onClick={() => setSelectedRole(r.name)}
                                className={`w-full text-right p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                    isSelected
                                        ? 'border-red-600 bg-red-50/40 shadow-sm'
                                        : 'border-gray-200/80 hover:border-gray-300 hover:bg-gray-50/50'
                                }`}
                            >
                                <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white bg-gradient-to-br ${r.color} shadow-sm`}
                                >
                                    <Icon className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-gray-900">
                                                {r.title}
                                            </span>
                                            {isCurrent && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                                                    نقش فعلی
                                                </span>
                                            )}
                                        </div>

                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                isSelected
                                                    ? 'border-red-600 bg-red-600 text-white'
                                                    : 'border-gray-300 bg-white'
                                            }`}
                                        >
                                            {isSelected && <FiCheck className="w-3 h-3 stroke-[3]" />}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {r.description}
                                    </p>
                                </div>
                            </button>
                        )
                    })}
                </div>

                {/* دکمه‌های تایید و انصراف */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={loading || selectedRole === currentRoleName}
                        className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-bold shadow-md shadow-red-200 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    >
                        {loading ? (
                            <>
                                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                <span>در حال اعمال نقش...</span>
                            </>
                        ) : (
                            <span>ذخیره تغییرات نقش</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
