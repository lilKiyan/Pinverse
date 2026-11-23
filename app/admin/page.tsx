"use client"

import { useState, useMemo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AdminCategoryModal from '../components/AdminCategoryModal'
import { getCategoryIcon } from '@/lib/categories'
import {
    FiShield,
    FiArrowRight,
    FiUsers,
    FiFlag,
    FiTrash2,
    FiCheckCircle,
    FiAlertCircle,
    FiAlertTriangle,
    FiSearch,
    FiLock,
    FiX,
    FiTag,
    FiImage,
    FiHeart,
    FiMessageCircle,
    FiUserX,
    FiUserCheck,
    FiEdit2,
    FiPlus,
    FiRefreshCw,
    FiExternalLink,
} from 'react-icons/fi'

const EditUserModal = dynamic(() => import('@/app/components/EditUserModal'), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/app/components/DeleteUserModal'), { ssr: false })

type Stats = {
    totalUsers: number
    totalPins: number
    totalReports: number
    pendingReports: number
    totalLikes: number
    totalMessages: number
}

type AdminReport = {
    id: string
    reason: string
    description: string | null
    createdAt: string
    pin: {
        id: string
        title: string
        imageUrl: string
        user: { id: string; username: string; name: string }
    }
    reporter: { id: string; username: string; name: string }
}

type AdminUserRow = {
    id: string
    name: string
    username: string
    avatar: string | null
    email: string
    banned: boolean
    createdAt: string
    _count: { pins: number; followers: number }
}

type CategoryRow = {
    id: string
    slug: string
    name: string
    icon: string
    color: string
    sortOrder: number
    isActive: boolean
    _count: { pins: number }
}

type Tab = 'reports' | 'users' | 'categories'
type UserStatusFilter = 'all' | 'active' | 'banned'
type ToastState = { message: string; type: 'success' | 'error' } | null

const REASON_LABELS: Record<string, string> = {
    spam: 'اسپم یا تبلیغات',
    inappropriate: 'محتوای نامناسب',
    violence: 'خشونت یا آزاردهنده',
    hate: 'نفرت‌پراکنی',
    misinformation: 'اطلاعات نادرست',
    other: 'سایر',
}

export default function AdminPage() {
    const queryClient = useQueryClient()

    const [tab, setTab] = useState<Tab>('reports')
    const [toast, setToast] = useState<ToastState>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const [reportSearch, setReportSearch] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [userStatusFilter, setUserStatusFilter] = useState<UserStatusFilter>('all')
    const [categorySearch, setCategorySearch] = useState('')

    const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)
    const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null)
    const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null)
    const [creatingCategory, setCreatingCategory] = useState(false)
    const [categoryToDelete, setCategoryToDelete] = useState<CategoryRow | null>(null)

    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        }
    }, [])

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
        toastTimerRef.current = setTimeout(() => setToast(null), 3000)
    }

    const {
        data: statsData,
        isLoading: loadingStats,
        isFetching: fetchingStats,
        isError: statsError,
    } = useQuery<{ stats: Stats }>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await fetch('/api/admin/stats')
            if (!res.ok) throw new Error(res.status === 403 ? 'دسترسی ندارید' : 'خطا')
            return res.json()
        },
        staleTime: 30 * 1000,
    })

    const {
        data: reportsData,
        isLoading: loadingReports,
        isFetching: fetchingReports,
    } = useQuery<{ reports: AdminReport[] }>({
        queryKey: ['admin-reports'],
        queryFn: async () => {
            const res = await fetch('/api/admin/reports')
            if (!res.ok) throw new Error('خطا در دریافت گزارش‌ها')
            return res.json()
        },
        enabled: !!statsData && tab === 'reports',
    })

    const {
        data: usersData,
        isLoading: loadingUsers,
        isFetching: fetchingUsers,
    } = useQuery<{ users: AdminUserRow[] }>({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('خطا در دریافت کاربران')
            return res.json()
        },
        enabled: !!statsData && tab === 'users',
    })

    const {
        data: categoriesData,
        isLoading: loadingCategories,
        isFetching: fetchingCategories,
    } = useQuery<{ categories: CategoryRow[] }>({
        queryKey: ['admin-categories'],
        queryFn: async () => {
            const res = await fetch('/api/admin/categories')
            if (!res.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها')
            return res.json()
        },
        enabled: !!statsData && tab === 'categories',
    })

    const reportActionMutation = useMutation({
        mutationFn: async ({
            reportId,
            action,
        }: {
            reportId: string
            action: 'delete-pin' | 'dismiss'
        }) => {
            const res = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reportId, action }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ثبت عملیات')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            queryClient.invalidateQueries({ queryKey: ['pins'] })
            showToast(data.message || 'عملیات با موفقیت انجام شد')
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    })

    const banMutation = useMutation({
        mutationFn: async ({ userId, banned }: { userId: string; banned: boolean }) => {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, banned }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در تغییر وضعیت کاربر')
            }
            return res.json()
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-users'] })
            showToast(data.message || 'وضعیت کاربر به‌روزرسانی شد')
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    })

    const deleteCategoryMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در حذف دسته‌بندی')
            }
            return res.json()
        },
        onSuccess: (data) => {
            setCategoryToDelete(null)
            queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
            queryClient.invalidateQueries({ queryKey: ['categories-all'] })
            showToast(data.message || 'دسته‌بندی حذف شد')
        },
        onError: (err: Error) => showToast(err.message, 'error'),
    })

    const handleReportAction = (reportId: string, action: 'delete-pin' | 'dismiss') => {
        setActionLoading(reportId)
        reportActionMutation.mutate(
            { reportId, action },
            { onSettled: () => setActionLoading(null) }
        )
    }

    const handleBan = (userId: string, banned: boolean) => {
        setActionLoading(userId)
        banMutation.mutate(
            { userId, banned },
            { onSettled: () => setActionLoading(null) }
        )
    }

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
        if (tab === 'reports') queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
        if (tab === 'users') queryClient.invalidateQueries({ queryKey: ['admin-users'] })
        if (tab === 'categories') queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    }

    const reports = reportsData?.reports ?? []
    const users = usersData?.users ?? []
    const categories = categoriesData?.categories ?? []

    const filteredReports = useMemo(() => {
        const q = reportSearch.trim().toLowerCase()
        if (!q) return reports
        return reports.filter(
            (r) =>
                r.pin.title.toLowerCase().includes(q) ||
                r.pin.user.name.toLowerCase().includes(q) ||
                r.pin.user.username.toLowerCase().includes(q) ||
                (REASON_LABELS[r.reason] || r.reason).toLowerCase().includes(q) ||
                r.reporter.name.toLowerCase().includes(q)
        )
    }, [reports, reportSearch])

    const filteredUsers = useMemo(() => {
        const q = userSearch.trim().toLowerCase()
        return users.filter((u) => {
            if (userStatusFilter === 'active' && u.banned) return false
            if (userStatusFilter === 'banned' && !u.banned) return false
            if (!q) return true
            return (
                u.name.toLowerCase().includes(q) ||
                u.username.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
            )
        })
    }, [users, userSearch, userStatusFilter])

    const filteredCategories = useMemo(() => {
        const q = categorySearch.trim().toLowerCase()
        if (!q) return categories
        return categories.filter(
            (c) =>
                c.name.toLowerCase().includes(q) ||
                c.slug.toLowerCase().includes(q)
        )
    }, [categories, categorySearch])

    const bannedUsersCount = useMemo(
        () => users.filter((u) => u.banned).length,
        [users]
    )

    const isRefreshing =
        fetchingStats || fetchingReports || fetchingUsers || fetchingCategories

    const stats = statsData?.stats

    const activeSearchValue =
        tab === 'reports'
            ? reportSearch
            : tab === 'users'
              ? userSearch
              : categorySearch

    const setActiveSearchValue = (value: string) => {
        if (tab === 'reports') setReportSearch(value)
        else if (tab === 'users') setUserSearch(value)
        else setCategorySearch(value)
    }

    const searchPlaceholder =
        tab === 'reports'
            ? 'جستجو در گزارش‌ها (عنوان پین، کاربر، دلیل)...'
            : tab === 'users'
              ? 'جستجوی کاربر (نام، یوزرنیم، ایمیل)...'
              : 'جستجوی دسته‌بندی (نام یا اسلاگ)...'

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-[#FAFAFB] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-14"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-44 -left-24 h-72 w-72 rounded-full bg-indigo-200/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-7xl">
                <header className="mb-6 flex flex-wrap items-center justify-between gap-3 animate-[fadeInUp_0.3s_ease-out_both]">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            aria-label="بازگشت به خانه"
                            className="group flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl
                                bg-white text-gray-500 ring-1 ring-gray-200/90 shadow-sm
                                hover:bg-gray-900 hover:text-white hover:ring-gray-900
                                transition-all duration-200 active:scale-95 no-underline"
                        >
                            <FiArrowRight className="h-4 w-4" />
                        </Link>

                        <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
                            <FiShield className="h-4 w-4" />
                            {stats && (
                                <span className="absolute -top-1 -left-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                                </span>
                            )}
                        </div>

                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                                پنل مدیریت
                            </h1>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                                {stats
                                    ? stats.pendingReports > 0
                                        ? `${stats.pendingReports.toLocaleString('fa-IR')} گزارش در انتظار بررسی`
                                        : 'همه‌چیز تحت نظارت است'
                                    : statsError
                                      ? 'دسترسی غیرمجاز'
                                      : 'در حال بررسی دسترسی...'}
                            </p>
                        </div>
                    </div>

                    {stats && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                title="بروزرسانی داده‌ها"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-gray-50
                                    px-3.5 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200/90 shadow-sm
                                    active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                            >
                                <FiRefreshCw
                                    className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
                                />
                                <span className="hidden sm:inline">بروزرسانی</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setTab('categories')
                                    setCreatingCategory(true)
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-red-600
                                    px-3.5 py-2 text-xs font-bold text-white shadow-sm
                                    active:scale-95 transition-all cursor-pointer"
                            >
                                <FiPlus className="h-3.5 w-3.5" />
                                <span>دسته‌بندی جدید</span>
                            </button>
                        </div>
                    )}
                </header>

                {statsError && (
                    <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/70 animate-[fadeInUp_0.35s_ease-out]">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
                            <FiLock className="h-6 w-6" />
                        </div>
                        <h2 className="text-base font-extrabold text-gray-900">
                            دسترسی محدود شده است
                        </h2>
                        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                            این بخش فقط برای مدیران سیستم در دسترس است.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 py-2.5 text-xs font-bold text-white transition-colors no-underline"
                        >
                            <FiArrowRight className="h-3.5 w-3.5" />
                            بازگشت به صفحه اصلی
                        </Link>
                    </div>
                )}

                {loadingStats && !statsError && <AdminDashboardSkeleton />}

                {stats && (
                    <div className="space-y-5">
                        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-[fadeInUp_0.35s_ease-out_40ms_backwards]">
                            {[
                                {
                                    key: 'pending',
                                    icon: FiFlag,
                                    label: 'گزارش باز',
                                    value: stats.pendingReports,
                                    alert: stats.pendingReports > 0,
                                    iconBg: stats.pendingReports > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600',
                                    onClick: () => setTab('reports'),
                                },
                                {
                                    key: 'users',
                                    icon: FiUsers,
                                    label: 'کاربران',
                                    value: stats.totalUsers,
                                    iconBg: 'bg-blue-50 text-blue-600',
                                    onClick: () => setTab('users'),
                                },
                                {
                                    key: 'pins',
                                    icon: FiImage,
                                    label: 'پین‌ها',
                                    value: stats.totalPins,
                                    iconBg: 'bg-rose-50 text-rose-600',
                                },
                                {
                                    key: 'likes',
                                    icon: FiHeart,
                                    label: 'لایک‌ها',
                                    value: stats.totalLikes,
                                    iconBg: 'bg-pink-50 text-pink-600',
                                },
                                {
                                    key: 'messages',
                                    icon: FiMessageCircle,
                                    label: 'پیام‌ها',
                                    value: stats.totalMessages,
                                    iconBg: 'bg-indigo-50 text-indigo-600',
                                },
                                {
                                    key: 'reports',
                                    icon: FiFlag,
                                    label: 'کل گزارش‌ها',
                                    value: stats.totalReports,
                                    iconBg: 'bg-amber-50 text-amber-600',
                                    onClick: () => setTab('reports'),
                                },
                            ].map((item) => {
                                const Icon = item.icon
                                const InteractiveTag = item.onClick ? 'button' : 'div'

                                return (
                                    <InteractiveTag
                                        key={item.key}
                                        type={item.onClick ? 'button' : undefined}
                                        onClick={item.onClick}
                                        className={`group text-right rounded-2xl p-3.5 sm:p-4 ring-1 transition-all duration-200 flex flex-col justify-between gap-3 ${
                                            item.alert
                                                ? 'bg-red-50/75 ring-red-200/90 hover:ring-red-300'
                                                : 'bg-white ring-gray-200/75 shadow-sm hover:ring-gray-300'
                                        } ${item.onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''}`}
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.iconBg}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            {item.alert && (
                                                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                                    فوری
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <p
                                                className={`text-lg sm:text-xl font-black tabular-nums leading-none ${
                                                    item.alert ? 'text-red-700' : 'text-gray-900'
                                                }`}
                                            >
                                                {item.value.toLocaleString('fa-IR')}
                                            </p>
                                            <p className="mt-1 text-[11px] font-semibold text-gray-500">
                                                {item.label}
                                            </p>
                                        </div>
                                    </InteractiveTag>
                                )
                            })}
                        </section>

                        <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-sm animate-[fadeInUp_0.35s_ease-out_80ms_backwards]">
                            <div className="border-b border-gray-100 p-4 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                                <div className="grid grid-cols-3 lg:inline-flex items-center gap-1 rounded-xl bg-gray-100/90 p-1 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => setTab('reports')}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                            tab === 'reports'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <FiFlag
                                            className={`h-3.5 w-3.5 shrink-0 ${
                                                tab === 'reports' ? 'text-red-600' : 'text-gray-400'
                                            }`}
                                        />
                                        <span>گزارش‌ها</span>
                                        {stats.pendingReports > 0 && (
                                            <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white tabular-nums leading-none">
                                                {stats.pendingReports.toLocaleString('fa-IR')}
                                            </span>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTab('users')}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                            tab === 'users'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <FiUsers
                                            className={`h-3.5 w-3.5 shrink-0 ${
                                                tab === 'users' ? 'text-blue-600' : 'text-gray-400'
                                            }`}
                                        />
                                        <span>کاربران</span>
                                        <span className="hidden sm:inline rounded-full bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 tabular-nums leading-none">
                                            {stats.totalUsers.toLocaleString('fa-IR')}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setTab('categories')}
                                        className={`flex items-center justify-center gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                                            tab === 'categories'
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        <FiTag
                                            className={`h-3.5 w-3.5 shrink-0 ${
                                                tab === 'categories' ? 'text-rose-600' : 'text-gray-400'
                                            }`}
                                        />
                                        <span>دسته‌ها</span>
                                        {categories.length > 0 && (
                                            <span className="hidden sm:inline rounded-full bg-gray-200/70 px-1.5 py-0.5 text-[10px] font-bold text-gray-600 tabular-nums leading-none">
                                                {categories.length.toLocaleString('fa-IR')}
                                            </span>
                                        )}
                                    </button>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:justify-end">
                                    {tab === 'users' && (
                                        <div className="inline-flex items-center gap-1 rounded-xl bg-gray-50 p-1 ring-1 ring-gray-200/70 self-start sm:self-auto">
                                            {[
                                                { id: 'all' as const, label: 'همه' },
                                                { id: 'active' as const, label: 'فعال' },
                                                {
                                                    id: 'banned' as const,
                                                    label:
                                                        bannedUsersCount > 0
                                                            ? `مسدود (${bannedUsersCount.toLocaleString('fa-IR')})`
                                                            : 'مسدود',
                                                },
                                            ].map((f) => (
                                                <button
                                                    key={f.id}
                                                    type="button"
                                                    onClick={() => setUserStatusFilter(f.id)}
                                                    className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                                                        userStatusFilter === f.id
                                                            ? 'bg-white text-gray-900 shadow-xs ring-1 ring-gray-200/70'
                                                            : 'text-gray-500 hover:text-gray-800'
                                                    }`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="relative w-full sm:w-64 lg:w-72 group">
                                        <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                                        <input
                                            type="text"
                                            value={activeSearchValue}
                                            onChange={(e) => setActiveSearchValue(e.target.value)}
                                            placeholder={searchPlaceholder}
                                            className="w-full rounded-xl bg-gray-50/90 pr-9 pl-8 py-2 text-xs text-gray-800 placeholder:text-gray-400
                                                ring-1 ring-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all"
                                        />
                                        {activeSearchValue && (
                                            <button
                                                type="button"
                                                onClick={() => setActiveSearchValue('')}
                                                aria-label="پاک کردن جستجو"
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300 hover:text-gray-800 cursor-pointer"
                                            >
                                                <FiX className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* محتوای تب فعال */}
                            <div className="p-4 sm:p-5">
                                {/* ═══ تب گزارش‌ها ═══ */}
                                {tab === 'reports' && (
                                    <div>
                                        {loadingReports ? (
                                            <TabListSkeleton count={4} />
                                        ) : filteredReports.length === 0 ? (
                                            reportSearch.trim() ? (
                                                <EmptyState
                                                    icon={FiSearch}
                                                    title={`گزارشی با «${reportSearch.trim()}» پیدا نشد`}
                                                    subtitle="عبارت دیگری را امتحان کنید یا فیلتر جستجو را پاک کنید"
                                                    actionLabel="پاک کردن جستجو"
                                                    onAction={() => setReportSearch('')}
                                                />
                                            ) : (
                                                <div className="py-16 text-center">
                                                    <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                                                        <FiCheckCircle className="h-6 w-6" />
                                                    </div>
                                                    <p className="text-sm font-bold text-gray-900">
                                                        همه‌چیز تحت کنترل است
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-400">
                                                        در حال حاضر هیچ گزارش بازی برای بررسی وجود ندارد
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
                                                                                <span
                                                                                    dir="ltr"
                                                                                    className="text-gray-400"
                                                                                >
                                                                                    (@{report.pin.user.username})
                                                                                </span>
                                                                            </p>
                                                                        </div>

                                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-200/70 shrink-0">
                                                                            <FiFlag className="h-3 w-3" />
                                                                            {REASON_LABELS[report.reason] ||
                                                                                report.reason}
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
                                                                            {new Date(
                                                                                report.createdAt
                                                                            ).toLocaleDateString('fa-IR')}
                                                                        </p>

                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleReportAction(
                                                                                        report.id,
                                                                                        'dismiss'
                                                                                    )
                                                                                }
                                                                                disabled={isBusy}
                                                                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-100
                                                                                    px-3.5 py-2 text-xs font-bold text-gray-700 ring-1 ring-gray-200/90
                                                                                    transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                                                                            >
                                                                                <FiCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                                                                رد گزارش
                                                                            </button>

                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleReportAction(
                                                                                        report.id,
                                                                                        'delete-pin'
                                                                                    )
                                                                                }
                                                                                disabled={isBusy}
                                                                                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700
                                                                                    px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-red-500/20
                                                                                    transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
                                )}

                                {/* ═══ تب کاربران ═══ */}
                                {tab === 'users' && (
                                    <div>
                                        {loadingUsers ? (
                                            <TabListSkeleton count={6} />
                                        ) : filteredUsers.length === 0 ? (
                                            <EmptyState
                                                icon={userSearch ? FiSearch : FiUsers}
                                                title={
                                                    userSearch
                                                        ? `کاربری با «${userSearch.trim()}» پیدا نشد`
                                                        : userStatusFilter === 'banned'
                                                          ? 'هیچ کاربر مسدودی وجود ندارد'
                                                          : 'کاربری ثبت‌نام نکرده است'
                                                }
                                                subtitle={
                                                    userSearch || userStatusFilter !== 'all'
                                                        ? 'فیلترها را تغییر دهید تا کاربران بیشتری نمایش داده شوند'
                                                        : undefined
                                                }
                                                actionLabel={
                                                    userSearch || userStatusFilter !== 'all'
                                                        ? 'نمایش همه کاربران'
                                                        : undefined
                                                }
                                                onAction={() => {
                                                    setUserSearch('')
                                                    setUserStatusFilter('all')
                                                }}
                                            />
                                        ) : (
                                            <div className="divide-y divide-gray-100 rounded-2xl ring-1 ring-gray-200/70 overflow-hidden">
                                                {filteredUsers.map((u) => {
                                                    const isBusy = actionLoading === u.id

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
                                                                    className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm font-black text-white ring-1 ring-black/5 no-underline"
                                                                >
                                                                    {u.avatar ? (
                                                                        <Image
                                                                            src={u.avatar}
                                                                            alt={u.name}
                                                                            width={40}
                                                                            height={40}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        u.username?.charAt(0).toUpperCase()
                                                                    )}
                                                                </Link>

                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center gap-2">
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
                                                                        {u.banned ? (
                                                                            <span className="shrink-0 rounded-md bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                                                                مسدود
                                                                            </span>
                                                                        ) : (
                                                                            <span className="hidden md:inline-flex shrink-0 h-1.5 w-1.5 rounded-full bg-emerald-500" />
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

                                                            <div className="flex items-center justify-between sm:justify-end gap-3 pr-13 sm:pr-0">
                                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 tabular-nums">
                                                                    <span className="rounded-lg bg-gray-100/90 px-2 py-1 font-semibold">
                                                                        {u._count.pins.toLocaleString('fa-IR')} پین
                                                                    </span>
                                                                    <span className="rounded-lg bg-gray-100/90 px-2 py-1 font-semibold">
                                                                        {u._count.followers.toLocaleString('fa-IR')} فالوور
                                                                    </span>
                                                                </div>

                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingUser(u)}
                                                                        disabled={isBusy}
                                                                        title="ویرایش کاربر"
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500
                                                                            hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer active:scale-90 disabled:opacity-50"
                                                                    >
                                                                        <FiEdit2 className="h-3.5 w-3.5" />
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleBan(u.id, !u.banned)}
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
                                                                            {u.banned ? 'آزادسازی' : 'مسدود'}
                                                                        </span>
                                                                    </button>

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeletingUser(u)}
                                                                        disabled={isBusy}
                                                                        title="حذف کاربر"
                                                                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500
                                                                            hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer active:scale-90 disabled:opacity-50"
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
                                )}

                                {/* ═══ تب دسته‌بندی‌ها ═══ */}
                                {tab === 'categories' && (
                                    <div>
                                        {loadingCategories ? (
                                            <CategoryGridSkeleton count={6} />
                                        ) : filteredCategories.length === 0 ? (
                                            <EmptyState
                                                icon={categorySearch ? FiSearch : FiTag}
                                                title={
                                                    categorySearch
                                                        ? `دسته‌بندی‌ای با «${categorySearch.trim()}» پیدا نشد`
                                                        : 'هنوز دسته‌بندی‌ای ساخته نشده است'
                                                }
                                                actionLabel={
                                                    categorySearch
                                                        ? 'نمایش همه دسته‌ها'
                                                        : 'ساخت اولین دسته‌بندی'
                                                }
                                                onAction={() => {
                                                    if (categorySearch) setCategorySearch('')
                                                    else setCreatingCategory(true)
                                                }}
                                            />
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
                                                                    onClick={() => setEditingCategory(cat)}
                                                                    title="ویرایش دسته‌بندی"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer active:scale-90"
                                                                >
                                                                    <FiEdit2 className="h-3.5 w-3.5" />
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCategoryToDelete(cat)}
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
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            {/* ═══ توست وضعیت ═══ */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm animate-[fadeInUp_0.2s_ease-out]">
                    <div className="flex items-center justify-between gap-2.5 rounded-2xl bg-gray-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl ring-1 ring-white/10">
                        <div className="flex items-center gap-2 min-w-0">
                            {toast.type === 'error' ? (
                                <FiAlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                            ) : (
                                <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
                            )}
                            <span className="truncate">{toast.message}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-white/10 hover:text-white cursor-pointer"
                        >
                            <FiX className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ مودال تأیید حذف دسته‌بندی ═══ */}
            {categoryToDelete && createPortal(
                <div
                    className="fixed inset-0 z-[99999] w-screen h-screen min-h-dvh flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-[fadeIn_0.15s_ease-out]"
                    onClick={() => {
                        if (!deleteCategoryMutation.isPending) setCategoryToDelete(null)
                    }}
                >
                    <div
                        dir="rtl"
                        className="w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl ring-1 ring-black/5 animate-[scaleUp_0.2s_ease-out] my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <FiAlertTriangle className="h-5 w-5" />
                        </div>
                        <h3 className="text-center text-sm sm:text-base font-extrabold text-gray-900">
                            حذف دسته‌بندی «{categoryToDelete.name}»؟
                        </h3>
                        <p className="mt-1.5 text-center text-xs text-gray-500 leading-relaxed">
                            این دسته‌بندی دارای{' '}
                            <strong className="font-bold text-gray-800">
                                {categoryToDelete._count.pins.toLocaleString('fa-IR')} پین
                            </strong>{' '}
                            است. آیا از حذف آن مطمئن هستید؟
                        </p>

                        <div className="mt-5 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setCategoryToDelete(null)}
                                disabled={deleteCategoryMutation.isPending}
                                className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteCategoryMutation.mutate(categoryToDelete.id)}
                                disabled={deleteCategoryMutation.isPending}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50 shadow-md shadow-red-200"
                            >
                                {deleteCategoryMutation.isPending ? (
                                    <>
                                        <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                                        <span>در حال حذف...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 className="h-3.5 w-3.5" />
                                        <span>حذف دسته</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* ═══ مودال‌های موجود ═══ */}
            {editingUser && (
                <EditUserModal
                    userId={editingUser.id}
                    initialName={editingUser.name}
                    initialUsername={editingUser.username}
                    initialBio={null}
                    onClose={() => setEditingUser(null)}
                    onSaved={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                    }}
                />
            )}

            {deletingUser && (
                <DeleteUserModal
                    userId={deletingUser.id}
                    username={deletingUser.username}
                    pinCount={deletingUser._count.pins}
                    onClose={() => setDeletingUser(null)}
                    onDeleted={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                        queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
                    }}
                />
            )}

            {creatingCategory && (
                <AdminCategoryModal
                    category={null}
                    onClose={() => setCreatingCategory(false)}
                    onSaved={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                        queryClient.invalidateQueries({ queryKey: ['categories-all'] })
                    }}
                />
            )}

            {editingCategory && (
                <AdminCategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSaved={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
                        queryClient.invalidateQueries({ queryKey: ['categories-all'] })
                    }}
                />
            )}

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; transition-duration: 0.01ms !important; }
                }
            `}</style>
        </main>
    )
}

function EmptyState({
    icon: Icon,
    title,
    subtitle,
    actionLabel,
    onAction,
}: {
    icon: typeof FiSearch
    title: string
    subtitle?: string
    actionLabel?: string
    onAction?: () => void
}) {
    return (
        <div className="py-16 px-4 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-gray-800">{title}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
            {actionLabel && onAction && (
                <button
                    type="button"
                    onClick={onAction}
                    className="mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    )
}

function AdminDashboardSkeleton() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-28 rounded-2xl bg-white p-4 ring-1 ring-gray-200/70 flex flex-col justify-between"
                    >
                        <div className="h-8 w-8 rounded-xl bg-gray-100" />
                        <div className="space-y-1.5">
                            <div className="h-5 w-14 rounded-md bg-gray-100" />
                            <div className="h-3 w-16 rounded-md bg-gray-100/80" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-3xl bg-white p-5 ring-1 ring-gray-200/70 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="h-10 w-64 rounded-xl bg-gray-100" />
                    <div className="h-10 w-64 rounded-xl bg-gray-100" />
                </div>
                <TabListSkeleton count={4} />
            </div>
        </div>
    )
}

function TabListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-3 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3.5 rounded-2xl bg-gray-50/80 p-4 ring-1 ring-gray-100"
                >
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200/70" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-40 rounded-md bg-gray-200/70" />
                        <div className="h-3 w-56 rounded-md bg-gray-200/50" />
                    </div>
                    <div className="hidden sm:flex gap-2">
                        <div className="h-8 w-20 rounded-lg bg-gray-200/70" />
                        <div className="h-8 w-20 rounded-lg bg-gray-200/70" />
                    </div>
                </div>
            ))}
        </div>
    )
}

function CategoryGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 rounded-2xl bg-gray-50/80 p-3.5 ring-1 ring-gray-100"
                >
                    <div className="h-11 w-11 shrink-0 rounded-xl bg-gray-200/70" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-24 rounded-md bg-gray-200/70" />
                        <div className="h-3 w-32 rounded-md bg-gray-200/50" />
                    </div>
                </div>
            ))}
        </div>
    )
}