"use client"

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    FiFlag,
    FiCheckCircle,
    FiTrash2,
    FiSearch,
    FiX,
    FiExternalLink,
} from 'react-icons/fi'
import { AdminReport, REASON_LABELS } from '../../types'

type AdminReportsTabProps = {
    reports: AdminReport[]
    isLoading: boolean
    actionLoading: string | null
    pendingReportsCount: number
    onAction: (reportId: string, action: 'delete-pin' | 'dismiss') => void
}

export default function AdminReportsTab({
    reports,
    isLoading,
    actionLoading,
    pendingReportsCount,
    onAction,
}: AdminReportsTabProps) {
    const [search, setSearch] = useState('')

    const filteredReports = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return reports
        return reports.filter(
            (r) =>
                r.pin.title.toLowerCase().includes(q) ||
                r.pin.user.name.toLowerCase().includes(q) ||
                r.pin.user.username.toLowerCase().includes(q) ||
                (REASON_LABELS[r.reason] || r.reason).toLowerCase().includes(q) ||
                r.reporter.name.toLowerCase().includes(q)
        )
    }, [reports, search])

    return (
        <div>
            <div className="border-b border-gray-100 bg-[#FAFAFB] px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                        گزارش‌های تخلف ارسالی
                    </span>
                    {pendingReportsCount > 0 ? (
                        <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-[11px] font-bold">
                            {pendingReportsCount.toLocaleString('fa-IR')} مورد در انتظار بررسی
                        </span>
                    ) : (
                        <span className="rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[11px] font-bold">
                            تمام گزارش‌ها بررسی شده‌اند
                        </span>
                    )}
                </div>

                <div className="relative flex-1 sm:w-72 group">
                    <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="جستجو در گزارش‌ها (عنوان، دلیل، کاربر)..."
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
            </div>

            <div className="p-4 sm:p-5">
                {isLoading ? (
                    <div className="space-y-3 animate-pulse">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-100" />
                        ))}
                    </div>
                ) : filteredReports.length === 0 ? (
                    search.trim() ? (
                        <div className="py-16 text-center">
                            <FiSearch className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                            <p className="text-sm font-bold text-gray-700">
                                گزارشی با عبارت «{search.trim()}» پیدا نشد
                            </p>
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="mt-3 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 cursor-pointer"
                            >
                                پاک کردن جستجو
                            </button>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                <FiCheckCircle className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-bold text-gray-900">
                                همه‌چیز تحت کنترل است
                            </p>
                            <p className="mt-1 text-xs text-gray-400">
                                در حال حاضر هیچ گزارش باز یا تخلفی برای بررسی وجود ندارد
                            </p>
                        </div>
                    )
                ) : (
                    <div className="space-y-3">
                        {filteredReports.map((report) => {
                            const isBusy = actionLoading === report.id

                            return (
                                <article
                                    key={report.id}
                                    className="rounded-2xl bg-gray-50/70 hover:bg-white p-4 ring-1 ring-gray-200/70 hover:ring-gray-300/90 transition-all duration-200"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-3.5">
                                        <Link
                                            href={`/pin/${report.pin.id}`}
                                            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5 block group"
                                        >
                                            <Image
                                                src={report.pin.imageUrl}
                                                alt={report.pin.title}
                                                fill
                                                sizes="64px"
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </Link>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <Link
                                                        href={`/pin/${report.pin.id}`}
                                                        className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-900 hover:text-red-600 transition-colors no-underline max-w-full"
                                                    >
                                                        <span className="truncate">
                                                            {report.pin.title}
                                                        </span>
                                                        <FiExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                                    </Link>
                                                    <p className="mt-0.5 text-xs text-gray-500">
                                                        سازنده:{' '}
                                                        <Link
                                                            href={`/user/${report.pin.user.id}`}
                                                            className="font-semibold text-gray-700 hover:text-red-600 no-underline"
                                                        >
                                                            {report.pin.user.name}
                                                        </Link>{' '}
                                                        <span dir="ltr" className="text-gray-400">
                                                            (@{report.pin.user.username})
                                                        </span>
                                                    </p>
                                                </div>

                                                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-200/70 shrink-0">
                                                    <FiFlag className="h-3 w-3" />
                                                    {REASON_LABELS[report.reason] || report.reason}
                                                </span>
                                            </div>

                                            {report.description && (
                                                <p className="mt-2.5 rounded-xl bg-white px-3 py-2 text-xs text-gray-600 ring-1 ring-gray-200/70 leading-relaxed">
                                                    «{report.description}»
                                                </p>
                                            )}

                                            <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                <p className="text-[11px] text-gray-400">
                                                    گزارش‌دهنده:{' '}
                                                    <Link
                                                        href={`/user/${report.reporter.id}`}
                                                        className="font-semibold text-gray-600 hover:text-gray-900 no-underline"
                                                    >
                                                        {report.reporter.name}
                                                    </Link>
                                                    {' · '}
                                                    {new Date(report.createdAt).toLocaleDateString('fa-IR')}
                                                </p>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onAction(report.id, 'dismiss')}
                                                        disabled={isBusy}
                                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-100 px-3.5 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200/90 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                                    >
                                                        <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                        رد گزارش
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onAction(report.id, 'delete-pin')}
                                                        disabled={isBusy}
                                                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-red-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                                    >
                                                        {isBusy ? (
                                                            <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <FiTrash2 className="h-3.5 w-3.5" />
                                                        )}
                                                        حذف پین
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
