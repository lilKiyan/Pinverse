"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    FiUsers,
    FiShield,
    FiTrash2,
    FiEdit2,
    FiUserCheck,
    FiUserX,
    FiSearch,
    FiX,
    FiSliders,
    FiDownload,
} from 'react-icons/fi'
import { AdminUserRow, UserFilter, getRoleBadge } from '../../types'

type AdminUsersTabProps = {
    users: AdminUserRow[]
    isLoading: boolean
    actionLoading: string | null
    onEditUser: (user: AdminUserRow) => void
    onRoleModal: (user: AdminUserRow) => void
    onBanUser: (userId: string, banned: boolean) => void
    onDeleteUser: (user: AdminUserRow) => void
    onExportCSV: () => void
}

export default function AdminUsersTab({
    users,
    isLoading,
    actionLoading,
    onEditUser,
    onRoleModal,
    onBanUser,
    onDeleteUser,
    onExportCSV,
}: AdminUsersTabProps) {
    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState<UserFilter>('all')

    const bannedCount = useMemo(() => users.filter((u) => u.banned).length, [users])
    const adminCount = useMemo(() => users.filter((u) => u.roles?.[0]?.role?.name === 'admin').length, [users])
    const moderatorCount = useMemo(() => users.filter((u) => u.roles?.[0]?.role?.name === 'moderator').length, [users])

    const filteredUsers = useMemo(() => {
        const q = search.trim().toLowerCase()
        return users.filter((u) => {
            const roleName = u.roles?.[0]?.role?.name || 'user'
            if (filter === 'admin' && roleName !== 'admin') return false
            if (filter === 'moderator' && roleName !== 'moderator') return false
            if (filter === 'user' && roleName !== 'user') return false
            if (filter === 'banned' && !u.banned) return false

            if (!q) return true
            return (
                u.name.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            )
        })
    }, [users, search, filter])

    return (
        <div>
            {/* ── نوار فیلتر نقش‌ها، جستجو و خروجی CSV (Sub-Toolbar) ── */}
            <div className="border-b border-gray-100 bg-[#FAFAFB] px-4 sm:px-6 py-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* دکمه‌های فیلتر نقش */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0 ml-1">
                        <FiSliders className="h-3.5 w-3.5 text-gray-400" />
                        فیلتر نقش:
                    </span>
                    {[
                        { id: 'all' as const, label: 'همه' },
                        { id: 'admin' as const, label: `ادمین (${adminCount.toLocaleString('fa-IR')})`, dot: 'bg-red-500' },
                        { id: 'moderator' as const, label: `ناظر (${moderatorCount.toLocaleString('fa-IR')})`, dot: 'bg-blue-500' },
                        { id: 'user' as const, label: 'کاربر عادی' },
                        {
                            id: 'banned' as const,
                            label: bannedCount > 0 ? `مسدود (${bannedCount.toLocaleString('fa-IR')})` : 'مسدود',
                            dot: 'bg-rose-600',
                        },
                    ].map((f) => (
                        <button
                            key={f.id}
                            type="button"
                            onClick={() => setFilter(f.id)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                filter === f.id
                                    ? 'bg-gray-900 text-white shadow-xs'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/80'
                            }`}
                        >
                            {f.dot && (
                                <span
                                    className={`h-1.5 w-1.5 rounded-full ${filter === f.id ? 'bg-white' : f.dot}`}
                                />
                            )}
                            <span>{f.label}</span>
                        </button>
                    ))}
                </div>

                {/* جستجو و دکمه دانلود CSV */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-72 group">
                        <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی کاربر (نام، یوزرنیم، ایمیل)..."
                            className="w-full rounded-xl bg-white pr-9 pl-8 py-2 text-xs text-gray-800 placeholder:text-gray-400 ring-1 ring-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all shadow-2xs"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="پاک کردن جستجو"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300 cursor-pointer"
                            >
                                <FiX className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onExportCSV}
                        title="دانلود فایل اکسل لیست کاربران"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 px-3 py-2 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        <FiDownload className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">خروجی CSV</span>
                    </button>
                </div>
            </div>

            {/* لیست کاربران */}
            <div className="p-4 sm:p-5">
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-16 rounded-2xl bg-gray-50 ring-1 ring-gray-100" />
                        ))}
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-16 text-center">
                        <FiUsers className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-bold text-gray-700">
                            {search
                                ? `کاربری با عبارت «${search.trim()}» پیدا نشد`
                                : filter === 'banned'
                                  ? 'هیچ کاربر مسدودی وجود ندارد'
                                  : 'کاربری مطابق فیلتر انتخابی یافت نشد'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('')
                                setFilter('all')
                            }}
                            className="mt-3 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 cursor-pointer"
                        >
                            نمایش همه کاربران
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 rounded-2xl ring-1 ring-gray-200/70 overflow-hidden bg-white">
                        {filteredUsers.map((u) => {
                            const isBusy = actionLoading === u.id
                            const roleBadge = getRoleBadge(u)

                            return (
                                <div
                                    key={u.id}
                                    className={`p-3.5 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                                        u.banned
                                            ? 'bg-red-50/35 hover:bg-red-50/55'
                                            : 'bg-white hover:bg-gray-50/75'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Link
                                            href={`/user/${u.id}`}
                                            className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm font-black text-white ring-1 ring-black/5 no-underline"
                                        >
                                            {u.avatar ? (
                                                <Image
                                                    src={u.avatar}
                                                    alt={u.name}
                                                    width={44}
                                                    height={44}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                u.username?.charAt(0).toUpperCase()
                                            )}
                                        </Link>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <Link
                                                    href={`/user/${u.id}`}
                                                    className={`truncate text-xs sm:text-sm font-bold no-underline hover:text-red-600 transition-colors ${
                                                        u.banned
                                                            ? 'text-gray-400 line-through'
                                                            : 'text-gray-900'
                                                    }`}
                                                >
                                                    {u.name}
                                                </Link>

                                                <span
                                                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${roleBadge.bg}`}
                                                >
                                                    <span
                                                        className={`h-1.5 w-1.5 rounded-full ${roleBadge.dot}`}
                                                    />
                                                    {roleBadge.label}
                                                </span>

                                                {u.banned && (
                                                    <span className="shrink-0 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                                        مسدود
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-400">
                                                <span dir="ltr" className="truncate max-w-[140px]">
                                                    @{u.username}
                                                </span>
                                                <span>·</span>
                                                <span dir="ltr" className="truncate max-w-[190px]">
                                                    {u.email}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-2.5 pr-14 sm:pr-0">
                                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 tabular-nums">
                                            <span className="rounded-lg bg-gray-100/90 px-2 py-1 font-semibold">
                                                {u._count.pins.toLocaleString('fa-IR')} پین
                                            </span>
                                            <span className="rounded-lg bg-gray-100/90 px-2 py-1 font-semibold">
                                                {u._count.followers.toLocaleString('fa-IR')} فالوور
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {/* دکمه تغییر نقش */}
                                            <button
                                                type="button"
                                                onClick={() => onRoleModal(u)}
                                                disabled={isBusy}
                                                title="تغییر نقش و دسترسی"
                                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-gray-100 hover:bg-purple-50 hover:text-purple-700 px-2.5 text-[11px] font-bold text-gray-600 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                                            >
                                                <FiShield className="h-3.5 w-3.5 text-purple-600" />
                                                <span className="hidden md:inline">نقش</span>
                                            </button>

                                            {/* ویرایش کاربر */}
                                            <button
                                                type="button"
                                                onClick={() => onEditUser(u)}
                                                disabled={isBusy}
                                                title="ویرایش مشخصات"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer active:scale-90 disabled:opacity-50"
                                            >
                                                <FiEdit2 className="h-3.5 w-3.5" />
                                            </button>

                                            {/* مسدودسازی/آزادسازی */}
                                            <button
                                                type="button"
                                                onClick={() => onBanUser(u.id, !u.banned)}
                                                disabled={isBusy}
                                                title={u.banned ? 'آزادسازی کاربر' : 'مسدودسازی کاربر'}
                                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50 ${
                                                    u.banned
                                                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                                                }`}
                                            >
                                                {isBusy ? (
                                                    <span className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                ) : u.banned ? (
                                                    <FiUserCheck className="h-3.5 w-3.5" />
                                                ) : (
                                                    <FiUserX className="h-3.5 w-3.5" />
                                                )}
                                                <span className="hidden md:inline">
                                                    {u.banned ? 'آزاد' : 'مسدود'}
                                                </span>
                                            </button>

                                            {/* حذف کامل کاربر */}
                                            <button
                                                type="button"
                                                onClick={() => onDeleteUser(u)}
                                                disabled={isBusy}
                                                title="حذف کامل کاربر"
                                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer active:scale-90 disabled:opacity-50"
                                            >
                                                <FiTrash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
