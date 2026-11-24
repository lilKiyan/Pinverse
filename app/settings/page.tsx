"use client"

import { useEffect, useState, startTransition } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/authStore'
import { compressImage } from '@/lib/imageCompress'
import AuthGate from '../components/AuthGate'
import type { CurrentUser } from '../types/user'

import {
    FiUser,
    FiSettings,
    FiAtSign,
    FiMail,
    FiLock,
    FiCamera,
    FiSave,
    FiCheckCircle,
    FiAlertCircle,
    FiShield,
    FiTrash2,
    FiAlertTriangle,
    FiArrowRight,
    FiEye,
    FiEyeOff,
    FiX,
    FiRotateCcw,
} from 'react-icons/fi'

type MeResponse = { user: CurrentUser }
type UploadResponse = { imageUrl: string; width: number; height: number }
type UpdateProfileResponse = { user: CurrentUser }
type DeleteAccountResponse = { success: boolean; message: string }

export default function SettingsPage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const { user, setUser } = useAuthStore()

    const { data: meData, isLoading: checkingAuth } = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const res = await fetch('/api/auth/me')
            if (!res.ok) return null
            const data = await res.json()
            return data.user
        },
        enabled: !user,
        staleTime: 60 * 1000,
    })

    const currentUser = user || meData

    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [bio, setBio] = useState('')
    const [avatar, setAvatar] = useState('')
    const [oldPassword, setOldPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')

    const [showOldPass, setShowOldPass] = useState(false)
    const [showNewPass, setShowNewPass] = useState(false)

    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [isPreparing, setIsPreparing] = useState(false)

    useEffect(() => {
        if (!user && meData) {
            setUser(meData)
        }
    }, [user, meData, setUser])

    useEffect(() => {
        if (currentUser) {
            startTransition(() => {
                setName(currentUser.name || '')
                setUsername(currentUser.username || '')
                setEmail(currentUser.email || '')
                setBio(currentUser.bio || '')
                setAvatar(currentUser.avatar || '')
            })
        }
    }, [currentUser])

    const uploadAvatarMutation = useMutation({
        mutationFn: async (file: File): Promise<UploadResponse> => {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('خطا در آپلود تصویر')
            return res.json()
        },
        onSuccess: (data) => {
            setAvatar(data.imageUrl)
        },
        onError: (err: Error) => {
            setError(err.message)
        },
    })

    const updateProfileMutation = useMutation({
        mutationFn: async (): Promise<UpdateProfileResponse> => {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    username: username.trim(),
                    email: email.trim(),
                    bio: bio.trim(),
                    avatar,
                    oldPassword: oldPassword || undefined,
                    newPassword: newPassword || undefined,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ذخیره تغییرات')
            }
            return res.json()
        },
        onSuccess: (data) => {
            if (data.user) {
                setUser(data.user)
            }
            setSuccess('تغییرات پروفایل با موفقیت ذخیره شد')
            setOldPassword('')
            setNewPassword('')
            setError('')

            queryClient.invalidateQueries({ queryKey: ['me'] })
            queryClient.invalidateQueries({ queryKey: ['user', data.user?.id] })

            setTimeout(() => setSuccess(''), 3500)
        },
        onError: (err: Error) => {
            setError(err.message)
            setSuccess('')
        },
    })

    const deleteAccountMutation = useMutation({
        mutationFn: async (): Promise<DeleteAccountResponse> => {
            const res = await fetch('/api/user', { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در حذف حساب')
            }
            return res.json()
        },
        onSuccess: () => {
            setUser(null)
            queryClient.clear()
            router.push('/')
            router.refresh()
        },
        onError: (err: Error) => {
            setError(err.message)
            setIsDeleteModalOpen(false)
        },
    })

    const handleDeleteAccount = () => {
        if (deleteConfirmText !== 'حذف') return
        deleteAccountMutation.mutate()
    }

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!name.trim() || !username.trim() || !email.trim()) {
            setError('نام، نام کاربری و ایمیل الزامی هستند')
            return
        }

        updateProfileMutation.mutate()
    }

    const handleReset = () => {
        if (!user) return
        setName(currentUser.name || '')
        setUsername(currentUser.username || '')
        setEmail(currentUser.email || '')
        setBio(currentUser.bio || '')
        setAvatar(currentUser.avatar || '')
        setOldPassword('')
        setNewPassword('')
        setError('')
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        e.target.value = ''
        setIsPreparing(true)
        setError('')

        try {
            const { file: compressed } = await compressImage(file)
            uploadAvatarMutation.mutate(compressed)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در پردازش تصویر')
        } finally {
            setIsPreparing(false)
        }
    }

    if (checkingAuth && !currentUser) {
        return (
            <main dir="rtl" className="min-h-[80vh] flex justify-center items-center bg-[#FAFAFB]">
                <div className="flex flex-col items-center gap-3">
                    <span className="w-7 h-7 border-[3px] border-gray-200 border-t-red-600 rounded-full animate-spin" />
                    <p className="text-xs text-gray-400 font-medium">در حال بررسی ورود...</p>
                </div>
            </main>
        )
    }

    if (!currentUser) {
        return (
            <AuthGate
                icon={FiSettings}
                title="تنظیمات حساب کاربری"
                description="برای مدیریت اطلاعات کاربری، امنیت و ویرایش پروفایل ابتدا وارد شوید."
                redirectUrl="/settings"
            />
        )
    }

    const isLoading = updateProfileMutation.isPending
    const isUploading = uploadAvatarMutation.isPending || isPreparing

    const hasChanges =
        name !== (currentUser.name || '') ||
        username !== (currentUser.username || '') ||
        email !== (currentUser.email || '') ||
        bio !== (currentUser.bio || '') ||
        avatar !== (currentUser.avatar || '') ||
        oldPassword.length > 0 ||
        newPassword.length > 0

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-[#FAFAFB] px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-12"
        >
            {/* هاله‌های لطیف پس‌زمینه */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 right-1/4 h-72 w-72 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-3xl">
                <header className="mb-6 flex items-center justify-between gap-3 animate-[fadeInUp_0.3s_ease-out_both]">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            aria-label="بازگشت به خانه"
                            className="group flex h-9 w-9 shrink-0 items-center justify-center rounded-xl
                                bg-white text-gray-500 ring-1 ring-gray-200/90 shadow-sm
                                hover:bg-gray-900 hover:text-white hover:ring-gray-900
                                transition-all duration-200 active:scale-95 no-underline"
                        >
                            <FiArrowRight className="h-4 w-4" />
                        </Link>

                        <div>
                            <h1 className="text-base sm:text-lg font-extrabold text-gray-900 tracking-tight">
                                تنظیمات حساب کاربری
                            </h1>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                                اطلاعات پروفایل، تصویر و رمز عبور خود را مدیریت کنید
                            </p>
                        </div>
                    </div>
                </header>

                {success && (
                    <div className="mb-4 flex items-center justify-between gap-2.5 rounded-2xl bg-emerald-50/90 px-4 py-3 text-emerald-700 ring-1 ring-emerald-200/80 animate-[fadeInUp_0.25s_ease-out]">
                        <div className="flex items-center gap-2">
                            <FiCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="text-xs font-semibold">{success}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSuccess('')}
                            className="rounded-lg p-1 text-emerald-500 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                            <FiX className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                {error && (
                    <div className="mb-4 flex items-center justify-between gap-2.5 rounded-2xl bg-red-50/90 px-4 py-3 text-red-700 ring-1 ring-red-200/80 animate-[fadeInUp_0.25s_ease-out]">
                        <div className="flex items-center gap-2">
                            <FiAlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                            <span className="text-xs font-semibold">{error}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setError('')}
                            className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                        >
                            <FiX className="h-3.5 w-3.5" />
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-sm">
                        <div className="h-1 bg-gradient-to-l from-red-500 via-rose-500 to-orange-400" />

                        <div className="p-5 sm:p-6 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-red-50 to-orange-50 ring-1 ring-gray-200/80 flex items-center justify-center text-xl font-black text-red-600">
                                            {avatar ? (
                                                <img
                                                    src={avatar}
                                                    alt="avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                currentUser.username?.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        {isUploading && (
                                            <div className="absolute inset-0 rounded-2xl bg-white/75 backdrop-blur-xs flex items-center justify-center">
                                                <span className="h-5 w-5 border-2 border-red-100 border-t-red-600 rounded-full animate-spin" />
                                            </div>
                                        )}

                                        <label
                                            className={`absolute -bottom-1.5 -left-1.5 flex h-7 w-7 items-center justify-center rounded-full
                                                bg-gray-900 text-white shadow-md ring-2 ring-white
                                                hover:bg-red-600 transition-all cursor-pointer active:scale-90
                                                ${isUploading ? 'opacity-60 pointer-events-none' : ''}`}
                                            title="تغییر تصویر پروفایل"
                                        >
                                            <FiCamera className="h-3.5 w-3.5" />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                disabled={isUploading}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-gray-900">
                                            {name || currentUser.name || 'کاربر'}
                                        </p>
                                        <p className="truncate text-xs text-gray-400 mt-0.5 text-right" dir="ltr">
                                            @{username || currentUser.username}
                                        </p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {isPreparing
                                                ? 'در حال بهینه‌سازی تصویر...'
                                                : 'فرمت‌های JPG، PNG یا WEBP'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-start sm:self-center">
                                    <label
                                        className={`inline-flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80
                                            px-3.5 py-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer
                                            ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <FiCamera className="h-3.5 w-3.5" />
                                        تغییر تصویر
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpload}
                                            disabled={isUploading}
                                            className="hidden"
                                        />
                                    </label>

                                    {avatar && (
                                        <button
                                            type="button"
                                            onClick={() => setAvatar('')}
                                            disabled={isUploading}
                                            className="rounded-xl px-3 py-2 text-xs font-semibold text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                        >
                                            حذف
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6 border-b border-gray-100">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                    <FiUser className="h-3.5 w-3.5" />
                                </span>
                                <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                                    اطلاعات شخصی
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="settings-name"
                                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                                    >
                                        نام کامل
                                    </label>
                                    <div className="relative group">
                                        <FiUser className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            id="settings-name"
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="نام و نام خانوادگی"
                                            className="w-full rounded-xl bg-gray-50/90 pr-9 pl-3.5 py-2.5 text-xs sm:text-[13px] text-gray-900 placeholder:text-gray-400
                                                ring-1 ring-gray-200/80
                                                focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="settings-username"
                                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                                    >
                                        نام کاربری
                                    </label>
                                    <div className="relative group">
                                        <FiAtSign className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            id="settings-username"
                                            type="text"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            dir="ltr"
                                            placeholder="username"
                                            className="w-full rounded-xl bg-gray-50/90 pr-9 pl-3.5 py-2.5 text-xs sm:text-[13px] text-gray-900 placeholder:text-gray-400
                                                ring-1 ring-gray-200/80
                                                focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label
                                        htmlFor="settings-email"
                                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                                    >
                                        آدرس ایمیل
                                    </label>
                                    <div className="relative group">
                                        <FiMail className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-red-500" />
                                        <input
                                            id="settings-email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            dir="ltr"
                                            placeholder="you@example.com"
                                            className="w-full rounded-xl bg-gray-50/90 pr-9 pl-3.5 py-2.5 text-xs sm:text-[13px] text-gray-900 placeholder:text-gray-400
                                                ring-1 ring-gray-200/80
                                                focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label
                                            htmlFor="settings-bio"
                                            className="text-xs font-semibold text-gray-700"
                                        >
                                            بیوگرافی
                                            <span className="mr-1 text-[11px] font-normal text-gray-400">(اختیاری)</span>
                                        </label>
                                        <span className="text-[11px] text-gray-400 tabular-nums">
                                            {bio.length.toLocaleString('fa-IR')} کاراکتر
                                        </span>
                                    </div>
                                    <textarea
                                        id="settings-bio"
                                        rows={2}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="چند کلمه کوتاه درباره خودتان و علایقتان..."
                                        className="w-full rounded-xl bg-gray-50/90 px-3.5 py-2.5 text-xs sm:text-[13px] text-gray-900 placeholder:text-gray-400
                                            ring-1 ring-gray-200/80 leading-relaxed resize-none
                                            focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/25 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                        <FiShield className="h-3.5 w-3.5" />
                                    </span>
                                    <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                                        تغییر رمز عبور
                                    </h2>
                                </div>
                                <span className="text-[11px] text-gray-400">
                                    در صورت عدم نیاز خالی بگذارید
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label
                                        htmlFor="settings-old-pass"
                                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                                    >
                                        رمز عبور فعلی
                                    </label>
                                    <div className="relative group">
                                        <FiLock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                                        <input
                                            id="settings-old-pass"
                                            type={showOldPass ? 'text' : 'password'}
                                            value={oldPassword}
                                            onChange={(e) => setOldPassword(e.target.value)}
                                            dir="ltr"
                                            placeholder="••••••••"
                                            className="w-full rounded-xl bg-gray-50/90 pr-9 pl-9 py-2.5 pt-3 text-xs sm:text-[13px] text-gray-900 placeholder:text-gray-400
                                                ring-1 ring-gray-200/80
                                                focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowOldPass((v) => !v)}
                                            aria-label={showOldPass ? 'مخفی کردن رمز' : 'نمایش رمز'}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                        >
                                            {showOldPass ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="settings-new-pass"
                                        className="block text-xs font-semibold text-gray-700 mb-1.5"
                                    >
                                        رمز عبور جدید
                                    </label>
                                    <div className="relative group">
                                        <FiLock className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 transition-colors group-focus-within:text-indigo-500" />
                                        <input
                                            id="settings-new-pass"
                                            type={showNewPass ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            dir="ltr"
                                            placeholder="••••••••"
                                            className="w-full rounded-xl bg-gray-50/90 pr-9 pl-9 py-2.5 pt-3 text-xs sm:text-[13px] text-gray-900 placeholder:text-gray-400
                                                ring-1 ring-gray-200/80
                                                focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25 transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPass((v) => !v)}
                                            aria-label={showNewPass ? 'مخفی کردن رمز' : 'نمایش رمز'}
                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                        >
                                            {showNewPass ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 sm:px-6 py-3.5">
                            <div className="hidden sm:flex items-center gap-2 text-[11px]">
                                {hasChanges ? (
                                    <span className="flex items-center gap-1.5 font-semibold text-amber-600">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        تغییرات ذخیره‌نشده دارید
                                    </span>
                                ) : (
                                    <span className="text-gray-400">
                                        تمامی اطلاعات به‌روز است
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {hasChanges && (
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        disabled={isLoading}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-gray-100
                                            px-3.5 py-2.5 text-xs font-bold text-gray-600 ring-1 ring-gray-200/90
                                            transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                        <FiRotateCcw className="h-3.5 w-3.5" />
                                        لغو
                                    </button>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading || isUploading || !hasChanges}
                                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl
                                        bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-bold text-white
                                        shadow-sm shadow-red-500/20 hover:brightness-105 active:scale-[0.98]
                                        transition-all cursor-pointer
                                        disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100"
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            در حال ذخیره...
                                        </>
                                    ) : (
                                        <>
                                            <FiSave className="h-3.5 w-3.5" />
                                            ذخیره تغییرات
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    <section className="rounded-2xl bg-white p-4 sm:p-5 ring-1 ring-red-200/70">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                                    <FiAlertTriangle className="h-4 w-4" />
                                </span>
                                <div>
                                    <h2 className="text-xs sm:text-sm font-bold text-gray-900">
                                        حذف حساب کاربری
                                    </h2>
                                    <p className="mt-1 text-[11px] sm:text-xs text-gray-500 leading-relaxed">
                                        با حذف حساب، تمامی پین‌ها، بردها، ذخیره‌ها، دیدگاه‌ها و پیام‌ها برای همیشه پاک می‌شوند و قابل بازیابی نیستند.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl
                                    bg-red-50 hover:bg-red-600 text-red-600 hover:text-white
                                    ring-1 ring-red-200/80 hover:ring-red-600
                                    px-4 py-2 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                            >
                                <FiTrash2 className="h-3.5 w-3.5" />
                                حذف حساب
                            </button>
                        </div>
                    </section>
                </form>
            </div>

            {isDeleteModalOpen && createPortal(
                <div
                    className="fixed inset-0 z-[99999] w-screen h-screen min-h-dvh flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-[fadeIn_0.15s_ease-out]"
                    onClick={() => {
                        if (!deleteAccountMutation.isPending) {
                            setIsDeleteModalOpen(false)
                            setDeleteConfirmText('')
                        }
                    }}
                >
                    <div
                        dir="rtl"
                        className="relative w-full max-w-sm rounded-3xl bg-white p-5 sm:p-6 shadow-2xl ring-1 ring-black/5 animate-[scaleUp_0.2s_ease-out] my-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => {
                                setIsDeleteModalOpen(false)
                                setDeleteConfirmText('')
                            }}
                            aria-label="بستن"
                            className="absolute top-4 left-4 flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                        >
                            <FiX className="h-4 w-4" />
                        </button>

                        <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                            <FiAlertTriangle className="h-5 w-5" />
                        </div>

                        <h3 className="text-center text-sm sm:text-base font-extrabold text-gray-900">
                            حذف دائمی حساب کاربری
                        </h3>

                        <p className="mt-1.5 text-center text-xs text-gray-500 leading-relaxed">
                            این عملیات غیرقابل بازگشت است. برای تأیید، کلمه
                            <span className="mx-1 inline-block rounded-md bg-red-50 px-1.5 py-0.5 font-bold text-red-600">
                                حذف
                            </span>
                            را در کادر زیر بنویسید.
                        </p>

                        <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            placeholder="حذف"
                            dir="rtl"
                            autoFocus
                            className="mt-4 mb-4 w-full rounded-xl bg-gray-50 px-3.5 py-2.5 text-center text-xs sm:text-sm font-bold text-gray-900 placeholder:text-gray-300
                                ring-1 ring-gray-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                        />

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsDeleteModalOpen(false)
                                    setDeleteConfirmText('')
                                }}
                                className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                            >
                                انصراف
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmText !== 'حذف' || deleteAccountMutation.isPending}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700
                                    py-2.5 text-xs font-bold text-white transition-colors cursor-pointer
                                    disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-200"
                            >
                                {deleteAccountMutation.isPending ? (
                                    <>
                                        <span className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                                        در حال حذف...
                                    </>
                                ) : (
                                    <>
                                        <FiTrash2 className="h-3.5 w-3.5" />
                                        تأیید حذف
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
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