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
} from 'react-icons/fi'
import { AdminPin, CategoryRow } from '../../types'

type AdminPinsTabProps = {
    pins: AdminPin[]
    categories: CategoryRow[]
    isLoading: boolean
    pinSearch: string
    pinCategory: string
    pinPage: number
    totalPages: number
    onSearchChange: (search: string) => void
    onCategoryChange: (category: string) => void
    onPageChange: (page: number) => void
    onDeletePin: (pin: AdminPin) => void
}

export default function AdminPinsTab({
    pins,
    categories,
    isLoading,
    pinSearch,
    pinCategory,
    pinPage,
    totalPages,
    onSearchChange,
    onCategoryChange,
    onPageChange,
    onDeletePin,
}: AdminPinsTabProps) {
    const [localSearch, setLocalSearch] = useState(pinSearch)

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSearchChange(localSearch)
    }

    return (
        <div>
            {/* ── نوار فیلتر دسته‌بندی و جستجوی پین‌ها (Sub-Toolbar) ── */}
            <div className="border-b border-gray-100 bg-[#FAFAFB] px-4 sm:px-6 py-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                {/* فیلتر دسته‌بندی‌ها */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1 shrink-0 ml-1">
                        <FiTag className="h-3.5 w-3.5 text-gray-400" />
                        دسته‌بندی:
                    </span>
                    <button
                        type="button"
                        onClick={() => onCategoryChange('all')}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                            pinCategory === 'all'
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/80'
                        }`}
                    >
                        همه پین‌ها
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => onCategoryChange(cat.slug)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                                pinCategory === cat.slug
                                ? 'bg-gray-900 text-white shadow-xs'
                                : 'bg-white text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/80'
                            }`}
                        >
                            <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                        </button>
                    ))}
                </div>

                {/* فرم جستجوی پین */}
                <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72 group">
                    <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => {
                            setLocalSearch(e.target.value)
                            if (!e.target.value) onSearchChange('')
                        }}
                        onBlur={() => onSearchChange(localSearch)}
                        placeholder="جستجو در عنوان یا سازنده پین..."
                        className="w-full rounded-xl bg-white pr-9 pl-8 py-2 text-xs text-gray-800 placeholder:text-gray-400 ring-1 ring-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all shadow-2xs"
                    />
                    {localSearch && (
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSearch('')
                                onSearchChange('')
                            }}
                            aria-label="پاک کردن جستجو"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300 cursor-pointer"
                        >
                            <FiX className="h-3 w-3" />
                        </button>
                    )}
                </form>
            </div>

            {/* گرید پین‌ها */}
            <div className="p-4 sm:p-5">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="aspect-[4/5] rounded-2xl bg-gray-100 ring-1 ring-gray-200/60" />
                        ))}
                    </div>
                ) : pins.length === 0 ? (
                    <div className="py-16 text-center">
                        <FiImage className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-bold text-gray-700">
                            {pinSearch
                                ? `پینی با عبارت «${pinSearch.trim()}» پیدا نشد`
                                : 'هیچ پینی در این دسته وجود ندارد'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setLocalSearch('')
                                onSearchChange('')
                                onCategoryChange('all')
                            }}
                            className="mt-3 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 cursor-pointer"
                        >
                            نمایش همه پین‌ها
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3.5">
                            {pins.map((pin) => (
                                <div
                                    key={pin.id}
                                    className="group rounded-2xl border border-gray-200/80 bg-white p-2.5 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 ring-1 ring-black/5">
                                            <Image
                                                src={pin.imageUrl}
                                                alt={pin.title}
                                                fill
                                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            {pin._count.reports > 0 && (
                                                <span className="absolute top-2 right-2 rounded-lg bg-red-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md flex items-center gap-1">
                                                    <FiFlag className="h-3 w-3" />
                                                    {pin._count.reports.toLocaleString('fa-IR')} گزارش
                                                </span>
                                            )}
                                        </div>

                                        <h4 className="mt-2 text-xs font-bold text-gray-900 truncate" title={pin.title}>
                                            {pin.title}
                                        </h4>

                                        <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                                            <Link
                                                href={`/user/${pin.user.id}`}
                                                className="truncate text-gray-600 hover:text-red-600 no-underline max-w-[100px]"
                                            >
                                                {pin.user.name}
                                            </Link>
                                            {pin.category && (
                                                <span
                                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                                    style={{
                                                        backgroundColor: `${pin.category.color}18`,
                                                        color: pin.category.color,
                                                    }}
                                                >
                                                    {pin.category.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px] text-gray-400 tabular-nums">
                                            <span className="flex items-center gap-0.5">
                                                <FiHeart className="h-3 w-3 text-rose-500" />
                                                {pin._count.likes}
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                <FiBookmark className="h-3 w-3 text-blue-500" />
                                                {pin._count.saves}
                                            </span>
                                            <span className="flex items-center gap-0.5">
                                                <FiMessageCircle className="h-3 w-3 text-emerald-500" />
                                                {pin._count.comments}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                                        <Link
                                            href={`/pin/${pin.id}`}
                                            target="_blank"
                                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-gray-100 hover:bg-gray-200 py-1.5 text-[11px] font-bold text-gray-700 transition-colors no-underline"
                                        >
                                            <FiExternalLink className="h-3 w-3" />
                                            <span>مشاهده</span>
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={() => onDeletePin(pin)}
                                            title="حذف پین"
                                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer active:scale-95"
                                        >
                                            <FiTrash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
        </div>
    )
}
