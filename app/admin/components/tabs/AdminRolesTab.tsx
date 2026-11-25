"use client"

import React from 'react'
import Image from 'next/image'
import {
    FiShield,
    FiUserCheck,
    FiUsers,
    FiLock,
    FiCheckCircle,
    FiKey,
} from 'react-icons/fi'
import { AdminUserRow, getRoleBadge } from '../../types'

type AdminRolesTabProps = {
    users: AdminUserRow[]
    isLoading: boolean
    totalUsersCount: number
    onRoleModal: (user: AdminUserRow) => void
}

export default function AdminRolesTab({
    users,
    isLoading,
    totalUsersCount,
    onRoleModal,
}: AdminRolesTabProps) {
    const adminCount = users.filter((u) => u.roles?.[0]?.role?.name === 'admin').length
    const moderatorCount = users.filter((u) => u.roles?.[0]?.role?.name === 'moderator').length
    const standardUsersCount = Math.max(0, totalUsersCount - adminCount - moderatorCount)

    const staffUsers = users.filter((u) => {
        const role = u.roles?.[0]?.role?.name
        return role === 'admin' || role === 'moderator'
    })

    if (isLoading) {
        return (
            <div className="p-4 sm:p-5 space-y-4 animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-36 rounded-2xl bg-gray-50 ring-1 ring-gray-100" />
                    ))}
                </div>
                <div className="h-48 rounded-2xl bg-gray-50 ring-1 ring-gray-100" />
            </div>
        )
    }

    return (
        <div className="p-4 sm:p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-red-200/80 bg-gradient-to-br from-red-50/60 to-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm shadow-red-500/20">
                            <FiShield className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-black text-red-700">
                            {adminCount.toLocaleString('fa-IR')} مدیر
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900">
                        مدیران ارشد (Admin)
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        دسترسی نامحدود به تمامی بخش‌های مدیریتی، کاربران، انتصاب نقش‌ها، پین‌ها، گزارش‌ها و دسته‌بندی‌ها.
                    </p>
                    <div className="mt-4 pt-3 border-t border-red-100 flex items-center justify-between text-[11px] text-red-700 font-bold">
                        <span>دسترسی کامل (۹ از ۹ مجوز)</span>
                        <FiCheckCircle className="h-4 w-4" />
                    </div>
                </div>

                <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/60 to-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
                            <FiUserCheck className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-700">
                            {moderatorCount.toLocaleString('fa-IR')} ناظر
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900">
                        ناظران محتوا (Moderator)
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        دسترسی به بررسی گزارش‌ها، پایش پین‌ها، حذف محتوای ناقض قوانین و مشاهده کاربران (بدون امکان تغییر نقش‌ها).
                    </p>
                    <div className="mt-4 pt-3 border-t border-blue-100 flex items-center justify-between text-[11px] text-blue-700 font-bold">
                        <span>نظارت محتوا (۳ مجوز کلیدی)</span>
                        <FiCheckCircle className="h-4 w-4" />
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-700 text-white shadow-sm">
                            <FiUsers className="h-5 w-5" />
                        </div>
                        <span className="rounded-full bg-gray-200/80 px-2.5 py-1 text-xs font-black text-gray-700">
                            {standardUsersCount.toLocaleString('fa-IR')} کاربر
                        </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900">
                        کاربران عادی (User)
                    </h3>
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                        کاربران استاندارد سایت که می‌توانند پین ایجاد کنند، لایک کنند، کامنت بگذارند و برد بسازند.
                    </p>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                        <span>بدون دسترسی مدیریتی</span>
                        <FiLock className="h-3.5 w-3.5" />
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-sm font-extrabold text-gray-900">
                            اعضای تیم مدیریت و نظارت
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            لیست کاربرانی که دسترسی مدیریت یا نظارت به پنل را دارند
                        </p>
                    </div>
                    <span className="rounded-full bg-purple-50 text-purple-700 px-3 py-1 text-xs font-bold ring-1 ring-purple-200">
                        {staffUsers.length.toLocaleString('fa-IR')} نفر
                    </span>
                </div>

                {staffUsers.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">
                        کاربری در نقش ادمین یا ناظر یافت نشد
                    </p>
                ) : (
                    <div className="divide-y divide-gray-100 ring-1 ring-gray-100 rounded-xl overflow-hidden">
                        {staffUsers.map((staff) => {
                            const roleBadge = getRoleBadge(staff)

                            return (
                                <div
                                    key={staff.id}
                                    className="p-3.5 flex items-center justify-between gap-3 bg-white hover:bg-gray-50/80 transition-colors"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-sm font-black text-white">
                                            {staff.avatar ? (
                                                <Image
                                                    src={staff.avatar}
                                                    alt={staff.name}
                                                    width={40}
                                                    height={40}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                staff.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                                                    {staff.name}
                                                </span>
                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${roleBadge.bg}`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${roleBadge.dot}`}
                                                    />
                                                    {roleBadge.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                                <span dir="ltr">@{staff.username}</span>
                                                <span>·</span>
                                                <span dir="ltr">{staff.email}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRoleModal(staff)}
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-purple-800 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer active:scale-95 shrink-0"
                                    >
                                        <FiShield className="h-3.5 w-3.5 text-purple-600" />
                                        <span>تغییر نقش</span>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                    <FiKey className="h-4 w-4 text-gray-700" />
                    <h3 className="text-sm font-extrabold text-gray-900">
                        ماتریس مجوزهای دسترسی سیستم
                    </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                    {[
                        { key: 'roles.manage', title: 'مدیریت نقش‌ها', desc: 'تخصیص یا عزل نقش ادمین و ناظر', roles: ['admin'] },
                        { key: 'users.delete', title: 'حذف کامل کاربر', desc: 'پاکسازی اطلاعات و حذف حساب', roles: ['admin'] },
                        { key: 'users.ban', title: 'مسدودسازی کاربر', desc: 'محدود کردن دسترسی ورود', roles: ['admin'] },
                        { key: 'categories.manage', title: 'مدیریت دسته‌ها', desc: 'افزودن و ویرایش دسته‌بندی‌ها', roles: ['admin'] },
                        { key: 'users.edit', title: 'ویرایش مشخصات', desc: 'تغییر نام و نام کاربری', roles: ['admin'] },
                        { key: 'users.view', title: 'مشاهده کاربران', desc: 'مشاهده لیست کامل کاربران', roles: ['admin', 'moderator'] },
                        { key: 'reports.view', title: 'بررسی گزارش‌ها', desc: 'مشاهده گزارش‌های تخلف ارسال‌شده', roles: ['admin', 'moderator'] },
                        { key: 'reports.resolve', title: 'تعیین تکلیف گزارش', desc: 'رد یا تایید گزارش تخلف', roles: ['admin', 'moderator'] },
                        { key: 'pins.delete', title: 'حذف پین متخلف', desc: 'پاک کردن پین از دیتابیس', roles: ['admin', 'moderator'] },
                    ].map((p) => (
                        <div
                            key={p.key}
                            className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-bold text-gray-800">
                                        {p.title}
                                    </span>
                                    <code
                                        dir="ltr"
                                        className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200"
                                    >
                                        {p.key}
                                    </code>
                                </div>
                                <p className="text-[11px] text-gray-500">
                                    {p.desc}
                                </p>
                            </div>
                            <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex items-center gap-1.5">
                                {p.roles.map((r) => (
                                    <span
                                        key={r}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                            r === 'admin'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-blue-100 text-blue-700'
                                        }`}
                                    >
                                        {r === 'admin' ? 'مدیر ارشد' : 'ناظر'}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
