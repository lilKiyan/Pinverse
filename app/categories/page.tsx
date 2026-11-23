"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import {
    FiArrowLeft,
    FiArrowRight,
    FiSearch,
    FiTag,
    FiX,
    FiTrendingUp,
    FiGrid,
    FiLayers,
    FiRefreshCw,
} from 'react-icons/fi'
import { getCategoryBySlug, getCategoryIcon } from '@/lib/categories'

type CategoryRow = {
    id: string
    slug: string
    name: string
    icon: string
    color: string
    isActive: boolean
    _count: { pins: number }
}

type SortMode = 'popular' | 'alpha'

export default function CategoriesPage() {
    const [search, setSearch] = useState('')
    const [sortMode, setSortMode] = useState<SortMode>('popular')

    const {
        data: categoriesData,
        isLoading,
        isError,
        refetch,
    } = useQuery<{ categories: CategoryRow[] }>({
        queryKey: ['categories-all'],
        queryFn: async () => {
            const res = await fetch('/api/categories')
            if (!res.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها')
            return res.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    const categories = categoriesData?.categories ?? []

    const filteredCategories = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return categories
        return categories.filter((c) => c.name.toLowerCase().includes(q))
    }, [categories, search])

    const sortedCategories = useMemo(() => {
        return [...filteredCategories].sort((a, b) => {
            if (sortMode === 'alpha') {
                return a.name.localeCompare(b.name, 'fa')
            }
            return b._count.pins - a._count.pins
        })
    }, [filteredCategories, sortMode])

    const totalPins = useMemo(
        () => categories.reduce((sum, c) => sum + c._count.pins, 0),
        [categories]
    )

    const maxPins = useMemo(
        () => Math.max(...categories.map((c) => c._count.pins), 1),
        [categories]
    )

    const showSpotlight =
        !search.trim() && sortMode === 'popular' && sortedCategories.length >= 6

    const featuredCategories = showSpotlight ? sortedCategories.slice(0, 3) : []
    const regularCategories = showSpotlight
        ? sortedCategories.slice(3)
        : sortedCategories

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#FAFAFB] px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-24">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-32 right-1/4 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-40 -left-24 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl"
            />

            <div className="relative mx-auto max-w-7xl">
                <header className="mb-8 sm:mb-10 animate-[fadeInUp_0.45s_cubic-bezier(0.16,1,0.3,1)_both]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/"
                                aria-label="بازگشت به خانه"
                                className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl
                                    bg-white/90 backdrop-blur-md text-gray-500
                                    ring-1 ring-gray-200/80 shadow-sm
                                    hover:bg-gray-900 hover:text-white hover:ring-gray-900
                                    hover:shadow-lg hover:shadow-gray-900/15
                                    transition-all duration-300 active:scale-90 no-underline"
                            >
                                <FiArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                            </Link>

                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                                        کاوش دسته‌بندی‌ها
                                    </h1>
                                </div>
                                <p className="mt-1 text-xs sm:text-sm text-gray-500">
                                    موضوع مورد علاقه‌ات را پیدا کن و وارد دنیای الهام شو
                                </p>
                            </div>
                        </div>

                        {!isLoading && categories.length > 0 && (
                            <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                <div className="flex items-center gap-2 rounded-2xl bg-white/80 backdrop-blur-md px-3.5 py-2 ring-1 ring-gray-200/70 shadow-xs">
                                    <FiGrid className="h-3.5 w-3.5 text-rose-500" />
                                    <span className="text-xs font-bold text-gray-800 tabular-nums">
                                        {categories.length.toLocaleString('fa-IR')}
                                    </span>
                                    <span className="text-[11px] text-gray-400">دسته</span>
                                </div>

                                <div className="flex items-center gap-2 rounded-2xl bg-white/80 backdrop-blur-md px-3.5 py-2 ring-1 ring-gray-200/70 shadow-xs">
                                    <FiLayers className="h-3.5 w-3.5 text-indigo-500" />
                                    <span className="text-xs font-bold text-gray-800 tabular-nums">
                                        {totalPins.toLocaleString('fa-IR')}
                                    </span>
                                    <span className="text-[11px] text-gray-400">پین</span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <div className="mb-8 sm:mb-10 flex flex-col md:flex-row items-stretch md:items-center gap-3 animate-[fadeInUp_0.45s_cubic-bezier(0.16,1,0.3,1)_60ms_backwards]">
                    <div className="relative flex-1 group">
                        <FiSearch
                            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2
                                text-gray-400 transition-colors duration-200 group-focus-within:text-gray-900"
                        />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="جستجو بین دسته‌بندی‌ها..."
                            className="w-full rounded-2xl bg-white/90 backdrop-blur-md
                                pr-11 pl-11 py-3.5 text-sm text-gray-800 placeholder:text-gray-400
                                ring-1 ring-gray-200/80 shadow-xs
                                focus:outline-none focus:ring-2 focus:ring-gray-900/15 focus:bg-white focus:shadow-md
                                transition-all duration-200"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="پاک کردن جستجو"
                                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center
                                    rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800
                                    transition-colors cursor-pointer"
                            >
                                <FiX className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="inline-flex items-center self-start md:self-auto rounded-2xl bg-gray-100/80 p-1 ring-1 ring-gray-200/60">
                        <button
                            type="button"
                            onClick={() => setSortMode('popular')}
                            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                sortMode === 'popular'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            <FiTrendingUp className="h-3.5 w-3.5" />
                            محبوب‌ترین
                        </button>
                        <button
                            type="button"
                            onClick={() => setSortMode('alpha')}
                            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all duration-200 cursor-pointer ${
                                sortMode === 'alpha'
                                    ? 'bg-white text-gray-900 shadow-xs'
                                    : 'text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            حروف الفبا
                        </button>
                    </div>
                </div>

                {search.trim() && !isLoading && (
                    <div className="mb-5 flex items-center justify-between text-xs text-gray-500">
                        <span>
                            نمایش{' '}
                            <strong className="font-bold text-gray-900 tabular-nums">
                                {sortedCategories.length.toLocaleString('fa-IR')}
                            </strong>{' '}
                            نتیجه برای «{search.trim()}»
                        </span>
                    </div>
                )}

                {isLoading ? (
                    <CategoriesSkeleton />
                ) : isError ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 py-20 px-6 text-center ring-1 ring-gray-200/70">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
                            <FiTag className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                            در دریافت دسته‌بندی‌ها مشکلی پیش آمد
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                            لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید
                        </p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5
                                text-xs font-semibold text-white shadow-sm hover:bg-gray-800
                                active:scale-95 transition-all cursor-pointer"
                        >
                            <FiRefreshCw className="h-3.5 w-3.5" />
                            تلاش مجدد
                        </button>
                    </div>
                ) : sortedCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl bg-white/80 py-20 px-6 text-center ring-1 ring-gray-200/70">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                            <FiSearch className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-bold text-gray-800">
                            {search
                                ? 'دسته‌بندی‌ای با این نام پیدا نشد'
                                : 'هنوز دسته‌بندی‌ای ثبت نشده است'}
                        </p>
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="mt-4 rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                                نمایش همه دسته‌بندی‌ها
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {featuredCategories.length > 0 && (
                            <section>
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                                        <FiTrendingUp className="h-3.5 w-3.5" />
                                    </span>
                                    <h2 className="text-sm sm:text-base font-bold text-gray-900">
                                        محبوب‌ترین دسته‌بندی‌ها
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {featuredCategories.map((cat, index) => {
                                        const meta = getCategoryBySlug(cat.slug)
                                        const Icon = meta?.iconComponent ?? getCategoryIcon(cat.icon)
                                        const color = meta?.color ?? cat.color

                                        return (
                                            <Link
                                                key={cat.id}
                                                href={`/category/${cat.slug}`}
                                                style={
                                                    {
                                                        animationDelay: `${index * 60}ms`,
                                                        '--cat-color': color,
                                                        backgroundImage: `linear-gradient(135deg, ${color}14 0%, #ffffff 62%)`,
                                                    } as React.CSSProperties
                                                }
                                                className="group relative overflow-hidden rounded-3xl p-6
                                                    bg-white ring-1 ring-gray-200/75
                                                    hover:ring-[var(--cat-color)] hover:-translate-y-1
                                                    hover:shadow-xl hover:shadow-gray-200/70
                                                    transition-all duration-300 active:scale-[0.99]
                                                    no-underline animate-[fadeInUp_0.45s_cubic-bezier(0.16,1,0.3,1)_backwards]"
                                            >
                                                <Icon
                                                    aria-hidden="true"
                                                    className="pointer-events-none absolute -bottom-5 -left-5 h-32 w-32 opacity-[0.06]
                                                        transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:opacity-[0.11]"
                                                    style={{ color }}
                                                />

                                                <div className="relative flex items-start justify-between gap-4">
                                                    <span
                                                        className="flex h-14 w-14 items-center justify-center rounded-2xl
                                                            shadow-sm transition-all duration-300
                                                            group-hover:scale-110 group-hover:-rotate-6"
                                                        style={{
                                                            backgroundColor: color,
                                                            boxShadow: `0 10px 24px -6px ${color}66`,
                                                        }}
                                                    >
                                                        <Icon className="h-7 w-7 text-white" />
                                                    </span>

                                                    <span
                                                        className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                                                        style={{
                                                            backgroundColor: `${color}18`,
                                                            color,
                                                        }}
                                                    >
                                                        #{(index + 1).toLocaleString('fa-IR')} پرطرفدار
                                                    </span>
                                                </div>

                                                <div className="relative mt-6 flex items-end justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-base sm:text-lg font-extrabold text-gray-900">
                                                            {cat.name}
                                                        </h3>
                                                        <p className="mt-1 text-xs font-medium text-gray-500 tabular-nums">
                                                            {cat._count.pins.toLocaleString('fa-IR')} پین منتشر شده
                                                        </p>
                                                    </div>

                                                    <span
                                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full
                                                            bg-white/90 text-gray-400 ring-1 ring-gray-200/80
                                                            transition-all duration-300
                                                            group-hover:bg-gray-900 group-hover:text-white group-hover:ring-gray-900
                                                            group-hover:-translate-x-1"
                                                    >
                                                        <FiArrowLeft className="h-4 w-4" />
                                                    </span>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </section>
                        )}

                        <section>
                            {showSpotlight && (
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-sm sm:text-base font-bold text-gray-900">
                                        سایر دسته‌بندی‌ها
                                    </h2>
                                    <span className="text-xs text-gray-400 tabular-nums">
                                        {regularCategories.length.toLocaleString('fa-IR')} مورد
                                    </span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                                {regularCategories.map((cat, index) => {
                                    const meta = getCategoryBySlug(cat.slug)
                                    const Icon = meta?.iconComponent ?? getCategoryIcon(cat.icon)
                                    const color = meta?.color ?? cat.color
                                    const fillPercent = Math.max(
                                        Math.round((cat._count.pins / maxPins) * 100),
                                        8
                                    )

                                    return (
                                        <Link
                                            key={cat.id}
                                            href={`/category/${cat.slug}`}
                                            style={
                                                {
                                                    animationDelay: `${Math.min(index * 30, 360)}ms`,
                                                    '--cat-color': color,
                                                } as React.CSSProperties
                                            }
                                            className="group relative flex flex-col justify-between overflow-hidden
                                                rounded-3xl bg-white p-5
                                                ring-1 ring-gray-200/70 shadow-2xs
                                                hover:ring-[var(--cat-color)] hover:-translate-y-1.5
                                                hover:shadow-xl hover:shadow-gray-200/60
                                                transition-all duration-300 active:scale-[0.97]
                                                no-underline animate-[fadeInUp_0.45s_cubic-bezier(0.16,1,0.3,1)_backwards]"
                                        >
                                            <div
                                                aria-hidden="true"
                                                className="pointer-events-none absolute -top-12 -right-12 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-25"
                                                style={{ backgroundColor: color }}
                                            />

                                            <Icon
                                                aria-hidden="true"
                                                className="pointer-events-none absolute -bottom-3 -left-3 h-20 w-20 opacity-[0.04] transition-all duration-500 group-hover:scale-110 group-hover:opacity-[0.09]"
                                                style={{ color }}
                                            />

                                            <div className="relative">
                                                <div className="flex items-start justify-between">
                                                    <span
                                                        className="flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-2xl
                                                            transition-all duration-300
                                                            group-hover:scale-110 group-hover:-rotate-6"
                                                        style={{
                                                            backgroundColor: `${color}15`,
                                                            border: `1px solid ${color}24`,
                                                        }}
                                                    >
                                                        <Icon
                                                            className="h-6 w-6 transition-transform duration-300"
                                                            style={{ color }}
                                                        />
                                                    </span>

                                                    <FiArrowLeft
                                                        className="h-4 w-4 text-gray-300 opacity-0 translate-x-1
                                                            transition-all duration-300
                                                            group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-gray-800"
                                                    />
                                                </div>

                                                <h3 className="mt-4 truncate text-sm sm:text-[15px] font-bold text-gray-900">
                                                    {cat.name}
                                                </h3>
                                            </div>

                                            <div className="relative mt-3.5">
                                                <div className="flex items-center justify-between text-[11px] text-gray-400 tabular-nums">
                                                    <span>
                                                        {cat._count.pins.toLocaleString('fa-IR')} پین
                                                    </span>
                                                </div>

                                                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{
                                                            width: `${fillPercent}%`,
                                                            backgroundColor: color,
                                                            opacity: 0.75,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; transition-duration: 0.01ms !important; }
                }
            `}</style>
        </div>
    )
}

function CategoriesSkeleton() {
    return (
        <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-44 rounded-3xl bg-white p-6 ring-1 ring-gray-100 animate-pulse flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between">
                            <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                            <div className="h-6 w-20 rounded-full bg-gray-100" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-32 rounded-lg bg-gray-100" />
                            <div className="h-3 w-20 rounded-lg bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-40 rounded-3xl bg-white p-5 ring-1 ring-gray-100 animate-pulse flex flex-col justify-between"
                    >
                        <div className="h-12 w-12 rounded-2xl bg-gray-100" />
                        <div className="space-y-2">
                            <div className="h-3.5 w-24 rounded-md bg-gray-100" />
                            <div className="h-2.5 w-14 rounded-md bg-gray-100" />
                            <div className="h-1 w-full rounded-full bg-gray-100" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}