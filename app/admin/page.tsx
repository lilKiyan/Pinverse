"use client"

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    FiLock,
    FiArrowRight,
    FiAlertCircle,
    FiCheckCircle,
    FiX,
    FiAlertTriangle,
    FiTrash2,
} from 'react-icons/fi'

import {
    Stats,
    AdminReport,
    AdminUserRow,
    CategoryRow,
    RolesData,
    AdminPinsResponse,
    AdminPin,
    Tab,
    ToastState,
    PinStatusFilter,
} from './types'

import AdminNavbar from './components/AdminNavbar'
import AdminStatsOverview from './components/AdminStatsOverview'
import AdminTabsNavigation from './components/AdminTabsNavigation'
import AdminReportsTab from './components/tabs/AdminReportsTab'
import AdminUsersTab from './components/tabs/AdminUsersTab'
import AdminRolesTab from './components/tabs/AdminRolesTab'
import AdminPinsTab from './components/tabs/AdminPinsTab'
import AdminCategoriesTab from './components/tabs/AdminCategoriesTab'

const EditUserModal = dynamic(() => import('@/app/components/EditUserModal'), { ssr: false })
const DeleteUserModal = dynamic(() => import('@/app/components/DeleteUserModal'), { ssr: false })
const AdminRoleModal = dynamic(() => import('@/app/components/AdminRoleModal'), { ssr: false })
const AdminPinDeleteModal = dynamic(() => import('@/app/components/AdminPinDeleteModal'), { ssr: false })
const AdminCategoryModal = dynamic(() => import('../components/AdminCategoryModal'), { ssr: false })

export default function AdminPage() {
    const queryClient = useQueryClient()

    const [tab, setTab] = useState<Tab>('reports')
    const [toast, setToast] = useState<ToastState>(null)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const [pinSearch, setPinSearch] = useState('')
    const [pinCategory, setPinCategory] = useState('all')
    const [pinStatus, setPinStatus] = useState<PinStatusFilter>('all')
    const [pinPage, setPinPage] = useState(1)

    const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null)
    const [deletingUser, setDeletingUser] = useState<AdminUserRow | null>(null)
    const [roleModalUser, setRoleModalUser] = useState<AdminUserRow | null>(null)
    const [pinToDelete, setPinToDelete] = useState<AdminPin | null>(null)
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
        toastTimerRef.current = setTimeout(() => setToast(null), 3500)
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
        enabled: !!statsData && (tab === 'users' || tab === 'roles'),
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
        enabled: !!statsData,
    })

    const {
        data: rolesData,
        isLoading: loadingRoles,
        isFetching: fetchingRoles,
    } = useQuery<RolesData>({
        queryKey: ['admin-roles'],
        queryFn: async () => {
            const res = await fetch('/api/admin/roles')
            if (!res.ok) throw new Error('خطا در دریافت نقش‌ها')
            return res.json()
        },
        enabled: !!statsData && tab === 'roles',
    })

    const {
        data: pinsData,
        isLoading: loadingPins,
        isFetching: fetchingPins,
    } = useQuery<AdminPinsResponse>({
        queryKey: ['admin-pins', pinSearch, pinCategory, pinStatus, pinPage],
        queryFn: async () => {
            const params = new URLSearchParams()
            if (pinSearch.trim()) params.set('q', pinSearch.trim())
            if (pinCategory && pinCategory !== 'all') params.set('category', pinCategory)
            if (pinStatus && pinStatus !== 'all') params.set('status', pinStatus)
            params.set('page', String(pinPage))
            params.set('limit', '18')
            const res = await fetch(`/api/admin/pins?${params.toString()}`)
            if (!res.ok) throw new Error('خطا در دریافت پین‌ها')
            return res.json()
        },
        enabled: !!statsData && tab === 'pins',
    })

    const moderatePinMutation = useMutation({
        mutationFn: async ({
            pinId,
            status,
            reason,
        }: {
            pinId: string
            status: 'APPROVED' | 'REJECTED'
            reason?: string
        }) => {
            setActionLoading(`${pinId}:${status}`)
            const res = await fetch(`/api/admin/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, reason }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در تغییر وضعیت پین')
            }
            return res.json()
        },
        onSuccess: (data) => {
            showToast(data.message || 'وضعیت پین با موفقیت بروزرسانی شد', 'success')
            queryClient.invalidateQueries({ queryKey: ['admin-pins'] })
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
            queryClient.invalidateQueries({ queryKey: ['pins'] })
        },
        onError: (err: any) => {
            showToast(err.message || 'خطا در تغییر وضعیت پین', 'error')
        },
        onSettled: () => {
            setActionLoading(null)
        },
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
        if (tab === 'roles') queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
        if (tab === 'pins') queryClient.invalidateQueries({ queryKey: ['admin-pins'] })
        if (tab === 'categories') queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    }

    const reports = reportsData?.reports ?? []
    const users = usersData?.users ?? []
    const categories = categoriesData?.categories ?? []
    const pins = pinsData?.pins ?? []
    const stats = statsData?.stats

    const isRefreshing =
        fetchingStats || fetchingReports || fetchingUsers || fetchingCategories || fetchingRoles || fetchingPins

    const handleExportUsersCSV = () => {
        if (!users.length) {
            showToast('هیچ کاربری برای دریافت خروجی وجود ندارد', 'error')
            return
        }
        const headers = ['شناسه', 'نام', 'نام کاربری', 'ایمیل', 'نقش', 'تعداد پین', 'تعداد دنبال‌کننده', 'وضعیت', 'تاریخ عضویت']
        const rows = users.map((u) => {
            const role = u.roles?.[0]?.role?.name === 'admin' ? 'مدیر ارشد' : u.roles?.[0]?.role?.name === 'moderator' ? 'ناظر' : 'کاربر عادی'
            const status = u.banned ? 'مسدود' : 'فعال'
            const date = new Date(u.createdAt).toLocaleDateString('fa-IR')
            return [
                `"${u.id}"`,
                `"${u.name.replace(/"/g, '""')}"`,
                `"${u.username.replace(/"/g, '""')}"`,
                `"${u.email.replace(/"/g, '""')}"`,
                `"${role}"`,
                u._count.pins,
                u._count.followers,
                `"${status}"`,
                `"${date}"`,
            ].join(',')
        })

        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `pinverse-users-${new Date().toISOString().slice(0, 10)}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        showToast('فایل اکسل کاربران با موفقیت دانلود شد')
    }

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-x-hidden bg-[#F6F7F9] font-sans text-gray-900 pb-20"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute top-48 -left-20 h-80 w-80 rounded-full bg-indigo-200/25 blur-3xl"
            />

            <AdminNavbar
                stats={stats}
                isRefreshing={isRefreshing}
                onRefresh={handleRefresh}
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
                {statsError && (
                    <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-white p-8 text-center shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/70 animate-[fadeInUp_0.35s_ease-out]">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-red-100">
                            <FiLock className="h-6 w-6" />
                        </div>
                        <h2 className="text-base font-extrabold text-gray-900">
                            دسترسی محدود شده است
                        </h2>
                        <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">
                            این بخش فقط برای مدیران و ناظران تایید شده سایت در دسترس است.
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

                {loadingStats && !statsError && (
                    <div className="space-y-4 animate-pulse">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-gray-200/70" />
                            ))}
                        </div>
                        <div className="h-96 rounded-3xl bg-white ring-1 ring-gray-200/70" />
                    </div>
                )}

                {stats && (
                    <div className="space-y-6">
                        <AdminStatsOverview
                            stats={stats}
                            categoriesCount={categories.length}
                            rolesCount={rolesData?.roles?.length || 3}
                            onSelectTab={setTab}
                        />

                        <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-xs animate-[fadeInUp_0.35s_ease-out_80ms_backwards]">
                            <AdminTabsNavigation
                                activeTab={tab}
                                onSelectTab={setTab}
                                stats={stats}
                                categoriesCount={categories.length}
                            />

                            {tab === 'reports' && (
                                <AdminReportsTab
                                    reports={reports}
                                    isLoading={loadingReports}
                                    actionLoading={actionLoading}
                                    pendingReportsCount={stats.pendingReports}
                                    onAction={handleReportAction}
                                />
                            )}

                            {tab === 'users' && (
                                <AdminUsersTab
                                    users={users}
                                    isLoading={loadingUsers}
                                    actionLoading={actionLoading}
                                    onEditUser={setEditingUser}
                                    onRoleModal={setRoleModalUser}
                                    onBanUser={handleBan}
                                    onDeleteUser={setDeletingUser}
                                    onExportCSV={handleExportUsersCSV}
                                />
                            )}

                            {tab === 'roles' && (
                                <AdminRolesTab
                                    users={users}
                                    isLoading={loadingRoles || loadingUsers}
                                    totalUsersCount={stats.totalUsers}
                                    onRoleModal={setRoleModalUser}
                                />
                            )}

                            {tab === 'pins' && (
                                <AdminPinsTab
                                    pins={pins}
                                    categories={categories}
                                    isLoading={loadingPins}
                                    pinSearch={pinSearch}
                                    pinCategory={pinCategory}
                                    pinStatus={pinStatus}
                                    pinPage={pinPage}
                                    totalPages={pinsData?.totalPages || 1}
                                    counts={pinsData?.counts}
                                    actionLoading={actionLoading}
                                    onSearchChange={(q) => {
                                        setPinSearch(q)
                                        setPinPage(1)
                                    }}
                                    onCategoryChange={(c) => {
                                        setPinCategory(c)
                                        setPinPage(1)
                                    }}
                                    onStatusChange={(s) => {
                                        setPinStatus(s)
                                        setPinPage(1)
                                    }}
                                    onPageChange={setPinPage}
                                    onApprovePin={(pin) =>
                                        moderatePinMutation.mutateAsync({
                                            pinId: pin.id,
                                            status: 'APPROVED',
                                        })
                                    }
                                    onRejectPin={(pin, reason) =>
                                        moderatePinMutation.mutateAsync({
                                            pinId: pin.id,
                                            status: 'REJECTED',
                                            reason,
                                        })
                                    }
                                    onDeletePin={setPinToDelete}
                                />
                            )}

                            {tab === 'categories' && (
                                <AdminCategoriesTab
                                    categories={categories}
                                    isLoading={loadingCategories}
                                    onCreateCategory={() => setCreatingCategory(true)}
                                    onEditCategory={setEditingCategory}
                                    onDeleteCategory={setCategoryToDelete}
                                />
                            )}
                        </section>
                    </div>
                )}
            </div>

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
                        queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
                    }}
                />
            )}

            {roleModalUser && (
                <AdminRoleModal
                    user={roleModalUser}
                    onClose={() => setRoleModalUser(null)}
                    onRoleUpdated={(_newRole, message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
                        queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
                    }}
                />
            )}

            {pinToDelete && (
                <AdminPinDeleteModal
                    pin={pinToDelete}
                    onClose={() => setPinToDelete(null)}
                    onDeleted={(message) => {
                        showToast(message)
                        queryClient.invalidateQueries({ queryKey: ['admin-pins'] })
                        queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
                        queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
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
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95); }
                    to   { opacity: 1; transform: scale(1); }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; transition-duration: 0.01ms !important; }
                }
            `}</style>
        </main>
    )
}
