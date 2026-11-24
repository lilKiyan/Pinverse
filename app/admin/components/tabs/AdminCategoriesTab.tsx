"use client"

import React, { useState, useMemo } from 'react'
import {
    FiTag,
    FiSearch,
    FiX,
    FiPlus,
    FiEdit2,
    FiTrash2,
} from 'react-icons/fi'
import { CategoryRow } from '../../types'
import { getCategoryIcon } from '@/lib/categories'

type AdminCategoriesTabProps = {
    categories: CategoryRow[]
    isLoading: boolean
    onCreateCategory: () => void
    onEditCategory: (category: CategoryRow) => void
    onDeleteCategory: (category: CategoryRow) => void
}

export default function AdminCategoriesTab({
    categories,
    isLoading,
    onCreateCategory,
    onEditCategory,
    onDeleteCategory,
}: AdminCategoriesTabProps) {
    const [search, setSearch] = useState('')

    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return categories
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q)
        )
    }, [categories, search])

    return (
        <div>
            {/* ── نوار فیلتر و جستجوی دسته‌بندی‌ها (Sub-Toolbar) ── */}
            <div className="border-b border-gray-100 bg-[#FAFAFB] px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700">
                        دسته‌بندی‌های موضوعی سایت
                    </span>
                    <span className="rounded-full bg-gray-200/70 text-gray-700 px-2 py-0.5 text-[11px] font-bold tabular-nums">
                        {categories.length.toLocaleString('fa-IR')} دسته
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative flex-1 sm:w-72 group">
                        <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجوی دسته‌بندی (نام یا اسلاگ)..."
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
                        onClick={onCreateCategory}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
                    >
                        <FiPlus className="h-3.5 w-3.5" />
                        <span>دسته‌بندی جدید</span>
                    </button>
                </div>
            </div>

            {/* گرید دسته‌بندی‌ها */}
            <div className="p-4 sm:p-5">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="h-20 rounded-2xl bg-gray-50 ring-1 ring-gray-100" />
                        ))}
                    </div>
                ) : filteredCategories.length === 0 ? (
                    <div className="py-16 text-center">
                        <FiTag className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-sm font-bold text-gray-700">
                            {search
                                ? `دسته‌بندی‌ای با عبارت «${search.trim()}» پیدا نشد`
                                : 'هنوز دسته‌بندی‌ای ساخته نشده است'}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                if (search) setSearch('')
                                else onCreateCategory()
                            }}
                            className="mt-3 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-1.5 text-xs font-bold text-gray-700 cursor-pointer"
                        >
                            {search ? 'نمایش همه دسته‌ها' : 'ساخت اولین دسته‌بندی'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredCategories.map((cat) => {
                            const Icon = getCategoryIcon(cat.icon)
                            const isProtected = cat.slug === 'other'

                            return (
                                <div
                                    key={cat.id}
                                    className={`group rounded-2xl p-3.5 ring-1 transition-all duration-200 flex items-center gap-3 ${
                                        !cat.isActive
                                            ? 'bg-gray-50/80 ring-gray-200/60 opacity-75'
                                            : 'bg-white ring-gray-200/75 hover:ring-gray-300 hover:shadow-sm'
                                    }`}
                                >
                                    <span
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                                        style={{
                                            backgroundColor: `${cat.color}16`,
                                            border: `1px solid ${cat.color}28`,
                                        }}
                                    >
                                        <Icon
                                            className="h-5 w-5"
                                            style={{ color: cat.color }}
                                        />
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                            <p className="truncate text-xs sm:text-sm font-bold text-gray-900">
                                                {cat.name}
                                            </p>
                                            {!cat.isActive && (
                                                <span className="shrink-0 rounded-md bg-gray-200/80 px-1.5 py-0.5 text-[10px] font-bold text-gray-500">
                                                    غیرفعال
                                                </span>
                                            )}
                                            {isProtected && (
                                                <span className="shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-600">
                                                    پایه
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                                            <span dir="ltr" className="truncate">
                                                /{cat.slug}
                                            </span>
                                            <span>·</span>
                                            <span className="shrink-0 font-semibold text-gray-500 tabular-nums">
                                                {cat._count.pins.toLocaleString('fa-IR')} پین
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => onEditCategory(cat)}
                                            title="ویرایش دسته‌بندی"
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer active:scale-90"
                                        >
                                            <FiEdit2 className="h-3.5 w-3.5" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => onDeleteCategory(cat)}
                                            disabled={isProtected}
                                            title={
                                                isProtected
                                                    ? 'دسته پایه قابل حذف نیست'
                                                    : 'حذف دسته‌بندی'
                                            }
                                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                                        >
                                            <FiTrash2 className="h-3.5 w-3.5" />
                                        </button>
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
