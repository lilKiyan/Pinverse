"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
    FiImage,
    FiSearch,
    FiX,
    FiTag,
    FiFlag,
    FiHeart,
    FiBookmark,
    FiMessageCircle,
    FiExternalLink,
    FiTrash2,
    FiChevronRight,
    FiChevronLeft,
    FiCheckCircle,
    FiXCircle,
    FiClock,
    FiAlertTriangle,
    FiSliders,
    FiAlertCircle,
    FiCalendar,
} from 'react-icons/fi'
import { AdminPin, CategoryRow, PinStatusFilter } from '../../types'
import { useDragScroll } from '@/lib/useDragScroll'

type AdminPinsTabProps = {
    pins: AdminPin[]
    categories: CategoryRow[]
    isLoading: boolean
    pinSearch: string
    pinCategory: string
    pinStatus: PinStatusFilter
    pinPage: number
    totalPages: number
    counts?: {
        pending: number
        approved: number
        rejected: number
    }
    actionLoading?: string | null
    onSearchChange: (search: string) => void
    onCategoryChange: (category: string) => void
    onStatusChange: (status: PinStatusFilter) => void
    onPageChange: (page: number) => void
    onApprovePin: (pin: AdminPin) => Promise<unknown> | void
    onRejectPin: (pin: AdminPin, reason?: string) => Promise<unknown> | void
    onDeletePin: (pin: AdminPin) => void
}

export default function AdminPinsTab({
    pins,
    categories,
    isLoading,
    pinSearch,
    pinCategory,
    pinStatus,
    pinPage,
    totalPages,
    counts,
    actionLoading,
    onSearchChange,
    onCategoryChange,
    onStatusChange,
    onPageChange,
    onApprovePin,
    onRejectPin,
    onDeletePin,
}: AdminPinsTabProps) {
    const [localSearch, setLocalSearch] = useState(pinSearch)
    const [rejectingPin, setRejectingPin] = useState<AdminPin | null>(null)
    const [rejectReason, setRejectReason] = useState('')
    const [isSubmittingReject, setIsSubmittingReject] = useState(false)

    const categoriesScrollRef = useDragScroll<HTMLDivElement>()
    const statusScrollRef = useDragScroll<HTMLDivElement>()

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSearchChange(localSearch)
    }

    const quickRejectReasons = [
        'کیفیت نامناسب یا تار بودن تصویر',
        'محتوای نامناسب یا مغایر با موازین اخلاقی',
        'اسپم، تبلیغات نامرتبط یا لینک مخرب',
        'نقض قوانین حق نشر یا گزارش کاربران',
    ]

    const handleConfirmReject = async () => {
        if (!rejectingPin || isSubmittingReject) return
        setIsSubmittingReject(true)
        try {
            await onRejectPin(rejectingPin, rejectReason.trim() || undefined)
            setRejectingPin(null)
            setRejectReason('')
        } finally {
            setIsSubmittingReject(false)
        }
    }

    return (
        <div>
            {/* ── نوار ابزار ۱: فیلتر وضعیت تایید (Status Toolbar) ── */}
            <div className="border-b border-gray-100 bg-[#FAFAFB] px-4 sm:px-6 py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0 ml-1">
                        <FiSliders className="h-3.5 w-3.5 text-gray-400" />
                        وضعیت تایید:
                    </span>
                    <div
                        ref={statusScrollRef}
                        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 cursor-grab active:cursor-grabbing select-none"
                    >
                        {[
                            { id: 'all' as const, label: 'همه پین‌ها' },
                            {
                                id: 'PENDING' as const,
                                label: 'در انتظار تایید',
                                count: counts?.pending,
                                alert: (counts?.pending ?? 0) > 0,
                                dot: 'bg-amber-500',
                            },
                            {
                                id: 'APPROVED' as const,
                                label: 'تایید و منتشر شده',
                                count: counts?.approved,
                                dot: 'bg-emerald-500',
                            },
                            {
                                id: 'REJECTED' as const,
                                label: 'تایید نشده',
                                count: counts?.rejected,
                                dot: 'bg-rose-500',
                            },
                        ].map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => onStatusChange(s.id)}
                                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                    pinStatus === s.id
                                        ? 'bg-gray-900 text-white shadow-xs'
                                        : s.alert
                                        ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-300 hover:bg-amber-100'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/80'
                                }`}
                            >
                                {s.dot && (
                                    <span
                                        className={`h-2 w-2 rounded-full shrink-0 ${
                                            pinStatus === s.id ? 'bg-white' : s.dot
                                        } ${s.alert && pinStatus !== s.id ? 'animate-pulse' : ''}`}
                                    />
                                )}
                                <span>{s.label}</span>
                                {s.count !== undefined && s.count > 0 && (
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none ${
                                            pinStatus === s.id
                                                ? 'bg-white/20 text-white'
                                                : s.alert
                                                ? 'bg-amber-200 text-amber-900 font-black'
                                                : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {s.count.toLocaleString('fa-IR')}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {counts?.pending !== undefined && counts.pending > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl ring-1 ring-amber-200/80 shrink-0">
                        <FiClock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>
                            {counts.pending.toLocaleString('fa-IR')} پین جدید منتظر بررسی شماست
                        </span>
                    </div>
                )}
            </div>

            {/* ── نوار ابزار ۲: فیلتر دسته‌بندی و باکس جستجوی بزرگ و استاندارد (Sub-Toolbar) ── */}
            <div className="border-b border-gray-100 bg-[#FAFAFB] px-4 sm:px-6 py-3.5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3.5">
                {/* باکس جستجوی بزرگ و شاخص */}
                <form
                    onSubmit={handleSearchSubmit}
                    className="relative flex-1 min-w-[280px] max-w-2xl group"
                >
                    <FiSearch className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => {
                            setLocalSearch(e.target.value)
                            if (!e.target.value) onSearchChange('')
                        }}
                        onBlur={() => onSearchChange(localSearch)}
                        placeholder="جستجوی پین‌ها با عنوان، توضیحات یا نام سازنده..."
                        className="w-full h-11 sm:h-12 rounded-2xl bg-white pr-11 pl-10 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 ring-1 ring-gray-200/90 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all shadow-xs"
                    />
                    {localSearch && (
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSearch('')
                                onSearchChange('')
                            }}
                            aria-label="پاک کردن جستجو"
                            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300 hover:text-gray-800 cursor-pointer transition-colors"
                        >
                            <FiX className="h-3.5 w-3.5" />
                        </button>
                    )}
                </form>

                {/* اسلایدر جمع‌وجور دسته‌بندی‌ها با قابلیت درگ آسان موس */}
                <div className="flex items-center gap-2 max-w-full xl:max-w-xl overflow-hidden">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0 ml-1">
                        <FiTag className="h-3.5 w-3.5 text-gray-400" />
                        دسته‌ها:
                    </span>

                    <div
                        ref={categoriesScrollRef}
                        className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-1 cursor-grab active:cursor-grabbing select-none"
                    >
                        <button
                            type="button"
                            onClick={() => onCategoryChange('all')}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                                pinCategory === 'all'
                                    ? 'bg-gray-900 text-white shadow-xs'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/80'
                            }`}
                        >
                            همه
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => onCategoryChange(cat.slug)}
                                className={`rounded-xl px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                                    pinCategory === cat.slug
                                        ? 'bg-gray-900 text-white shadow-xs'
                                        : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/80'
                                }`}
                            >
                                <span
                                    className="h-2 w-2 rounded-full shrink-0"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <span>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── گرید کارت‌های شکیل و جادار (حداکثر ۴ کارت در هر ردیف) ── */}
            <div className="p-4 sm:p-6">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-pulse">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="h-[360px] rounded-3xl bg-gray-100 ring-1 ring-gray-200/60" />
                        ))}
                    </div>
                ) : pins.length === 0 ? (
                    <div className="py-16 text-center">
                        <FiImage className="mx-auto mb-2 h-9 w-9 text-gray-300" />
                        <p className="text-sm font-bold text-gray-700">
                            {pinSearch
                                ? `پینی با عبارت «${pinSearch.trim()}» پیدا نشد`
                                : pinStatus === 'PENDING'
                                ? 'در حال حاضر هیچ پینی در انتظار تایید وجود ندارد ✨'
                                : 'هیچ پینی در این فیلتر یافت نشد'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSearch('')
                                onSearchChange('')
                                onCategoryChange('all')
                                onStatusChange('all')
                            }}
                            className="mt-3.5 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 cursor-pointer"
                        >
                            نمایش همه پین‌ها
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {pins.map((pin) => {
                                const isPending = pin.status === 'PENDING'
                                const isApproved = pin.status === 'APPROVED'
                                const isRejected = pin.status === 'REJECTED'

                                const isApproving = actionLoading === `${pin.id}:APPROVED`
                                const isRejecting = actionLoading === `${pin.id}:REJECTED`
                                const isActing = isApproving || isRejecting

                                return (
                                    <div
                                        key={pin.id}
                                        className={`group rounded-3xl border bg-white p-3.5 transition-all duration-300 flex flex-col justify-between ${
                                            isPending
                                                ? 'border-amber-300/80 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-sm shadow-amber-100/60 hover:shadow-xl hover:shadow-amber-100/80 hover:-translate-y-0.5'
                                                : isRejected
                                                ? 'border-rose-200/80 bg-gradient-to-b from-rose-50/30 via-white to-white shadow-xs hover:shadow-lg'
                                                : 'border-gray-200/85 shadow-xs hover:shadow-lg hover:-translate-y-0.5'
                                        }`}
                                    >
                                        <div>
                                            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                                                <Image
                                                    src={pin.imageUrl}
                                                    alt={pin.title}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                />

                                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25 opacity-75 group-hover:opacity-90 transition-opacity" />

                                                <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-start z-10">
                                                    {isPending && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-white shadow-md ring-1 ring-white/25">
                                                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                                                            <span>در انتظار تایید</span>
                                                        </span>
                                                    )}
                                                    {isApproved && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-md ring-1 ring-white/20">
                                                            <FiCheckCircle className="h-3 w-3" />
                                                            <span>منتشر شده</span>
                                                        </span>
                                                    )}
                                                    {isRejected && (
                                                        <span
                                                            className="inline-flex items-center gap-1 rounded-full bg-rose-600/95 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white shadow-md ring-1 ring-white/20 cursor-help"
                                                            title={pin.rejectionReason || 'عدم تطابق با قوانین'}
                                                        >
                                                            <FiAlertCircle className="h-3 w-3" />
                                                            <span>تایید نشده</span>
                                                        </span>
                                                    )}

                                                    {pin._count.reports > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-600/95 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black text-white shadow-md ring-1 ring-white/20">
                                                            <FiFlag className="h-3 w-3" />
                                                            {pin._count.reports.toLocaleString('fa-IR')} گزارش
                                                        </span>
                                                    )}
                                                </div>

                                                <Link
                                                    href={`/pin/${pin.id}`}
                                                    target="_blank"
                                                    title="مشاهده پین در صفحه جدید"
                                                    className="absolute top-2.5 left-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 hover:bg-black/75 text-white backdrop-blur-md ring-1 ring-white/25 transition-all hover:scale-105"
                                                >
                                                    <FiExternalLink className="h-3.5 w-3.5" />
                                                </Link>

                                                {pin.category && (
                                                    <span
                                                        className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold text-gray-800 shadow-sm"
                                                    >
                                                        <span
                                                            className="h-2 w-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: pin.category.color }}
                                                        />
                                                        <span>{pin.category.name}</span>
                                                    </span>
                                                )}
                                            </div>

                                            <div className="mt-3 px-0.5">
                                                <h4
                                                    className="text-sm font-extrabold text-gray-900 line-clamp-1"
                                                    title={pin.title}
                                                >
                                                    {pin.title}
                                                </h4>
                                                {pin.description ? (
                                                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                                                        {pin.description}
                                                    </p>
                                                ) : (
                                                    <p className="mt-0.5 text-[11px] text-gray-400 italic">
                                                        بدون توضیحات
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-3 flex items-center justify-between gap-2 rounded-2xl bg-gray-50/90 px-2.5 py-2 ring-1 ring-gray-100">
                                                <Link
                                                    href={`/user/${pin.user.id}`}
                                                    className="flex items-center gap-2 min-w-0 no-underline group/user"
                                                >
                                                    {pin.user.avatar ? (
                                                        <Image
                                                            src={pin.user.avatar}
                                                            alt={pin.user.name}
                                                            width={28}
                                                            height={28}
                                                            className="h-7 w-7 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
                                                        />
                                                    ) : (
                                                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-red-600 text-[11px] font-black text-white">
                                                            {pin.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 group-hover/user:text-red-600 truncate transition-colors">
                                                            {pin.user.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 truncate" dir="ltr">
                                                            @{pin.user.username}
                                                        </p>
                                                    </div>
                                                </Link>

                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-400 shrink-0">
                                                    <FiCalendar className="h-3 w-3" />
                                                    {new Date(pin.createdAt).toLocaleDateString('fa-IR')}
                                                </span>
                                            </div>

                                            {isRejected && pin.rejectionReason && (
                                                <div className="mt-2 rounded-xl bg-rose-50 border border-rose-200/70 p-2 text-[11px] text-rose-700 leading-relaxed">
                                                    <span className="font-extrabold">علت عدم تایید: </span>
                                                    <span>{pin.rejectionReason}</span>
                                                </div>
                                            )}

                                            <div className="mt-2.5 flex items-center justify-around border-t border-gray-100 pt-2.5 text-[11px] font-semibold text-gray-500 tabular-nums">
                                                <span className="flex items-center gap-1" title="لایک‌ها">
                                                    <FiHeart className="h-3.5 w-3.5 text-rose-500" />
                                                    {pin._count.likes.toLocaleString('fa-IR')}
                                                </span>
                                                <span className="flex items-center gap-1" title="ذخیره‌ها">
                                                    <FiBookmark className="h-3.5 w-3.5 text-blue-500" />
                                                    {pin._count.saves.toLocaleString('fa-IR')}
                                                </span>
                                                <span className="flex items-center gap-1" title="دیدگاه‌ها">
                                                    <FiMessageCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                    {pin._count.comments.toLocaleString('fa-IR')}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                            {isPending && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onApprovePin(pin)}
                                                        disabled={isActing}
                                                        title="تایید و انتشار برای عموم"
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-2.5 px-3 text-xs font-extrabold transition-all shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 cursor-pointer active:scale-[0.98] disabled:opacity-65 disabled:cursor-not-allowed"
                                                    >
                                                        {isApproving ? (
                                                            <>
                                                                <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                                                                <span>در حال تایید...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiCheckCircle className="h-4 w-4 shrink-0" />
                                                                <span>تایید</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setRejectingPin(pin)}
                                                        disabled={isActing}
                                                        title="عدم تایید و ارسال دلیل"
                                                        className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white ring-1 ring-rose-200 hover:ring-rose-600 py-2.5 px-3 text-xs font-extrabold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {isRejecting ? (
                                                            <>
                                                                <span className="h-3.5 w-3.5 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin shrink-0" />
                                                                <span>در حال ثبت...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiXCircle className="h-4 w-4 shrink-0" />
                                                                <span>عدم تایید</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => onDeletePin(pin)}
                                                        disabled={isActing}
                                                        title="حذف کامل پین"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {isApproved && (
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/pin/${pin.id}`}
                                                        target="_blank"
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 transition-colors no-underline"
                                                    >
                                                        <FiExternalLink className="h-3.5 w-3.5" />
                                                        <span>مشاهده پین</span>
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() => setRejectingPin(pin)}
                                                        disabled={isActing}
                                                        title="لغو تایید و انتقال به عدم تایید"
                                                        className="inline-flex items-center justify-center gap-1 rounded-2xl bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white ring-1 ring-amber-200 hover:ring-amber-500 px-3 py-2.5 text-xs font-bold transition-all cursor-pointer disabled:opacity-60"
                                                    >
                                                        {isRejecting ? (
                                                            <>
                                                                <span className="h-3.5 w-3.5 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin shrink-0" />
                                                                <span>در حال ثبت...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiXCircle className="h-3.5 w-3.5 shrink-0" />
                                                                <span>عدم تایید</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeletePin(pin)}
                                                        disabled={isActing}
                                                        title="حذف کامل پین"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}

                                            {isRejected && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onApprovePin(pin)}
                                                        disabled={isActing}
                                                        title="تایید و انتشار مجدد پین"
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white py-2.5 text-xs font-extrabold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer disabled:opacity-65"
                                                    >
                                                        {isApproving ? (
                                                            <>
                                                                <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                                                                <span>در حال تایید...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FiCheckCircle className="h-4 w-4 shrink-0" />
                                                                <span>تایید و انتشار</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onDeletePin(pin)}
                                                        disabled={isActing}
                                                        title="حذف کامل پین"
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                                    >
                                                        <FiTrash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* کنترل صفحه‌بندی */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => onPageChange(Math.max(1, pinPage - 1))}
                                    disabled={pinPage <= 1}
                                    className="inline-flex items-center gap-1 rounded-xl bg-white hover:bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    <FiChevronRight className="h-4 w-4" />
                                    <span>قبلی</span>
                                </button>

                                <span className="text-xs font-semibold text-gray-500">
                                    صفحه {pinPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onPageChange(Math.min(totalPages, pinPage + 1))}
                                    disabled={pinPage >= totalPages}
                                    className="inline-flex items-center gap-1 rounded-xl bg-white hover:bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 disabled:opacity-40 cursor-pointer"
                                >
                                    <span>بعدی</span>
                                    <FiChevronLeft className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── مودال شکیل ثبت دلیل عدم تایید پین (همراه با اسپینر لودینگ) ── */}
            {rejectingPin && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.15s_ease-out]"
                    onClick={() => {
                        if (!isSubmittingReject) setRejectingPin(null)
                    }}
                >
                    <div
                        dir="rtl"
                        className="w-full max-w-md rounded-3xl bg-white p-5 sm:p-6 shadow-2xl ring-1 ring-black/5 animate-[scaleUp_0.2s_ease-out]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-rose-600">
                                <FiAlertTriangle className="h-5 w-5" />
                                <h3 className="text-sm sm:text-base font-extrabold text-gray-900">
                                    عدم تایید پین «{rejectingPin.title}»
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setRejectingPin(null)}
                                disabled={isSubmittingReject}
                                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 cursor-pointer disabled:opacity-40"
                            >
                                <FiX className="h-4 w-4" />
                            </button>
                        </div>

                        <p className="mt-3 text-xs text-gray-500 leading-relaxed">
                            علت عدم تایید این پین را انتخاب یا وارد کنید تا به صورت خودکار برای کاربر ارسال شود:
                        </p>

                        {/* دلایل سریع */}
                        <div className="mt-3 space-y-1.5">
                            {quickRejectReasons.map((reason, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    disabled={isSubmittingReject}
                                    onClick={() => setRejectReason(reason)}
                                    className={`w-full text-right px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border disabled:opacity-60 ${
                                        rejectReason === reason
                                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    {reason}
                                </button>
                            ))}
                        </div>

                        {/* دلیل دلخواه */}
                        <div className="mt-3">
                            <label className="block text-[11px] font-bold text-gray-600 mb-1">
                                یا دلیل سفارشی خود را بنویسید:
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                disabled={isSubmittingReject}
                                placeholder="مثلاً: تصویر نامرتبط با دسته انتخابی است..."
                                rows={2}
                                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none disabled:opacity-60"
                            />
                        </div>

                        <div className="mt-5 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setRejectingPin(null)}
                                disabled={isSubmittingReject}
                                className="flex-1 rounded-2xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 cursor-pointer disabled:opacity-50"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmReject}
                                disabled={isSubmittingReject}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white py-2.5 text-xs font-extrabold shadow-md shadow-rose-200 cursor-pointer disabled:opacity-70"
                            >
                                {isSubmittingReject ? (
                                    <>
                                        <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                                        <span>در حال ثبت...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiXCircle className="h-4 w-4" />
                                        <span>ثبت عدم تایید</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
