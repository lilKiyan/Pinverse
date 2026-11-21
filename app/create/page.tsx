"use client"

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
    FiUpload,
    FiImage,
    FiType,
    FiAlignLeft,
    FiAlertCircle,
    FiX,
    FiFile,
    FiCheck,
    FiCheckCircle,
    FiTag,
    FiLogIn,
    FiArrowRight,
    FiTrash2,
    FiRefreshCw,
} from 'react-icons/fi'
import { compressImage } from '@/lib/imageCompress'
import { getCategoryIcon } from '@/lib/categories'
import { useAuthStore } from '@/lib/authStore'

type CreatePinInput = {
    title: string
    description: string
    file: File
    width: number
    height: number
    category: string
}

type CategoryItem = {
    slug: string
    name: string
    icon: string
    color: string
}

export default function CreatePage() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const { user } = useAuthStore()

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

    const { data: categoriesData, isLoading: loadingCategories } = useQuery<{
        categories: CategoryItem[]
    }>({
        queryKey: ['categories-all'],
        queryFn: async () => {
            const res = await fetch('/api/categories')
            if (!res.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها')
            return res.json()
        },
        staleTime: 5 * 60 * 1000,
    })

    const currentUser = user || meData
    const categories = categoriesData?.categories ?? []

    // ── State های فرم و UI ──
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [isPreparing, setIsPreparing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [compressionInfo, setCompressionInfo] = useState<{ from: number; to: number } | null>(null)
    const [category, setCategory] = useState('other')

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    const createPinMutation = useMutation({
        mutationFn: async ({ title, description, file, width, height, category }: CreatePinInput) => {
            const formData = new FormData()
            formData.append('file', file)

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            })

            if (!uploadRes.ok) {
                const data = await uploadRes.json()
                throw new Error(data.error || 'خطا در آپلود تصویر')
            }

            const { imageUrl } = await uploadRes.json()

            const pinRes = await fetch('/api/pins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    imageUrl,
                    imageWidth: width,
                    imageHeight: height,
                    category,
                }),
            })

            if (!pinRes.ok) {
                const data = await pinRes.json()
                throw new Error(data.error || 'خطا در ساخت پین')
            }

            return pinRes.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pins'], refetchType: 'all' })
            queryClient.invalidateQueries({ queryKey: ['my-pins'], refetchType: 'all' })
            queryClient.invalidateQueries({ queryKey: ['categories-all'] })
            router.push('/')
        },
    })

    const processFile = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setSubmitError('لطفاً فقط فایل تصویری (PNG، JPG، WEBP یا GIF) انتخاب کنید')
            return
        }

        setSubmitError('')
        setIsPreparing(true)
        try {
            const { file: compressed, width, height, wasCompressed } = await compressImage(file)

            setSelectedFile(compressed)
            setDimensions({ width, height })
            setCompressionInfo(wasCompressed ? { from: file.size, to: compressed.size } : null)
            setPreviewUrl(URL.createObjectURL(compressed))
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'خطا در پردازش تصویر')
        } finally {
            setIsPreparing(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        await processFile(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        if (!isDragging) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) await processFile(file)
    }

    const handleRemoveFile = () => {
        setSelectedFile(null)
        setDimensions(null)
        setPreviewUrl('')
        setCompressionInfo(null)
        setSubmitError('')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || !selectedFile || !dimensions) return

        createPinMutation.mutate({
            title: title.trim(),
            description: description.trim(),
            file: selectedFile,
            width: dimensions.width,
            height: dimensions.height,
            category,
        })
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} بایت`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`
        return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`
    }

    const savedPercent = compressionInfo
        ? Math.max(1, Math.round((1 - compressionInfo.to / compressionInfo.from) * 100))
        : null

    const hasImage = Boolean(selectedFile && dimensions)
    const hasTitle = Boolean(title.trim())
    const isFormValid = hasImage && hasTitle && !isPreparing
    const loading = createPinMutation.isPending
    const activeError = (createPinMutation.error as Error | null)?.message || submitError
    const selectedCategoryObj = categories.find((c) => c.slug === category)

    if (checkingAuth && !currentUser) {
        return (
            <main dir="rtl" className="min-h-[75vh] flex items-center justify-center bg-[#FAFAFB]">
                <span className="w-7 h-7 border-[3px] border-gray-200 border-t-red-600 rounded-full animate-spin" />
            </main>
        )
    }

    if (!currentUser) {
        return (
            <main
                dir="rtl"
                className="relative min-h-[82vh] flex flex-col items-center justify-center px-4 overflow-hidden bg-[#FAFAFB] pb-24 lg:pb-8"
            >
                <div className="pointer-events-none absolute -top-24 right-1/3 h-80 w-80 rounded-full bg-rose-200/35 blur-3xl" />
                <div className="relative z-10 w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-xl p-8 text-center shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/70 space-y-5 animate-[fadeInUp_0.35s_ease-out]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
                        <FiUpload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-lg font-extrabold text-gray-900">
                            برای ساخت پین وارد شوید
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                            برای اشتراک‌گذاری ایده‌ها و تصاویر خود در Pinverse، ابتدا وارد حساب کاربری شوید.
                        </p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2.5">
                        <Link
                            href="/login"
                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-sm font-bold text-white shadow-md shadow-red-500/20 hover:brightness-105 active:scale-[0.98] transition-all no-underline"
                        >
                            <FiLogIn className="h-4 w-4" />
                            ورود به حساب کاربری
                        </Link>
                        <Link
                            href="/"
                            className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors no-underline"
                        >
                            بازگشت به صفحه اصلی
                        </Link>
                    </div>
                </div>
            </main>
        )
    }

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-[#FAFAFB] px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-12"
        >
            {/* هاله‌های لطیف پس‌زمینه */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl"
            />

            <div className="relative mx-auto max-w-5xl">
                {/* ═══ هدر استاندارد و جمع‌وجور ═══ */}
                <header className="mb-6 flex items-center justify-between gap-4 animate-[fadeInUp_0.35s_ease-out_both]">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            aria-label="بازگشت به خانه"
                            className="group flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl
                                bg-white text-gray-500 ring-1 ring-gray-200/90 shadow-2xs
                                hover:bg-gray-900 hover:text-white hover:ring-gray-900
                                transition-all duration-200 active:scale-95 no-underline"
                        >
                            <FiArrowRight className="h-4 w-4" />
                        </Link>

                        <div>
                            <h1 className="text-base sm:text-xl font-extrabold text-gray-900 tracking-tight">
                                ساخت پین جدید
                            </h1>
                            <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                                تصویر را آپلود کن، عنوان بنویس و در دسته‌بندی مناسب منتشر کن
                            </p>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 ring-1 ring-gray-200/80 text-xs">
                        <span className={`flex items-center gap-1 font-semibold ${hasImage ? 'text-emerald-600' : 'text-gray-400'}`}>
                            <FiCheckCircle className="h-3.5 w-3.5" />
                            تصویر
                        </span>
                        <span className="h-3 w-px bg-gray-200" />
                        <span className={`flex items-center gap-1 font-semibold ${hasTitle ? 'text-emerald-600' : 'text-gray-400'}`}>
                            <FiCheckCircle className="h-3.5 w-3.5" />
                            عنوان
                        </span>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ── باکس خطا ── */}
                    {activeError && (
                        <div className="flex items-center justify-between gap-3 rounded-2xl bg-red-50/90 px-4 py-3.5 text-red-700 ring-1 ring-red-200/80 animate-[fadeInUp_0.25s_ease-out]">
                            <div className="flex items-center gap-2.5">
                                <FiAlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                                <span className="text-xs sm:text-sm font-semibold">{activeError}</span>
                            </div>
                            {submitError && (
                                <button
                                    type="button"
                                    onClick={() => setSubmitError('')}
                                    className="rounded-lg p-1 text-red-400 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                                >
                                    <FiX className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* ═══ باکس واحد و هم‌تراز کل فرم ═══ */}
                    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-sm">
                        {/* نوار رنگی ظریف بالا */}
                        <div className="h-1 bg-gradient-to-l from-red-500 via-rose-500 to-orange-400" />

                        {/* ─── ردیف ۱: دو ستون دقیقاً هم‌ارتفاع ─── */}
                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            {/* ستون راست: آپلود و پیش‌نمایش تصویر */}
                            <div className="lg:col-span-5 flex flex-col p-5 sm:p-6 border-b lg:border-b-0 lg:border-l border-gray-100">
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                            <FiImage className="h-3.5 w-3.5" />
                                        </span>
                                        تصویر پین
                                        <span className="text-red-500">*</span>
                                    </span>

                                    {dimensions && (
                                        <span
                                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 tabular-nums"
                                            dir="ltr"
                                        >
                                            {dimensions.width} × {dimensions.height}
                                        </span>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {previewUrl ? (
                                    <div className="flex flex-1 flex-col gap-3">
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={`relative flex flex-1 min-h-[260px] max-h-[340px] items-center justify-center overflow-hidden rounded-2xl bg-gray-50 ring-1 transition-all ${
                                                isDragging
                                                    ? 'ring-2 ring-red-500 bg-red-50/40'
                                                    : 'ring-gray-200/80'
                                            }`}
                                        >
                                            <img
                                                src={previewUrl}
                                                alt="پیش‌نمایش پین"
                                                className="max-h-[340px] w-full object-contain"
                                            />

                                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="flex items-center gap-1.5 rounded-full bg-gray-900/75 hover:bg-gray-900 backdrop-blur-md
                                                        px-3 py-1.5 text-[11px] font-bold text-white shadow-md
                                                        transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <FiRefreshCw className="h-3 w-3" />
                                                    تغییر تصویر
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={handleRemoveFile}
                                                    aria-label="حذف تصویر"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full
                                                        bg-white/90 hover:bg-red-600 text-gray-600 hover:text-white
                                                        backdrop-blur-md shadow-md ring-1 ring-black/5
                                                        transition-all active:scale-90 cursor-pointer"
                                                >
                                                    <FiTrash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {isPreparing && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm">
                                                    <span className="h-6 w-6 border-[3px] border-red-100 border-t-red-600 rounded-full animate-spin" />
                                                    <span className="text-xs font-bold text-gray-700">در حال بهینه‌سازی...</span>
                                                </div>
                                            )}
                                        </div>

                                        {selectedFile && (
                                            <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2 ring-1 ring-gray-200/60">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 ring-1 ring-gray-200/80">
                                                    <FiFile className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-bold text-gray-800">
                                                        {selectedFile.name}
                                                    </p>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 tabular-nums">
                                                        <span>{formatFileSize(selectedFile.size)}</span>
                                                        {savedPercent && (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                                                                {savedPercent.toLocaleString('fa-IR')}٪ سبک‌تر شد
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`group flex flex-1 min-h-[280px] lg:min-h-[320px] w-full flex-col items-center justify-center
                                            rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-200 cursor-pointer ${
                                                isDragging
                                                    ? 'border-red-500 bg-red-50/70 scale-[0.99]'
                                                    : 'border-gray-200 bg-gray-50/70 hover:border-red-300 hover:bg-red-50/25'
                                            }`}
                                    >
                                        <div
                                            className={`mb-4 flex h-13 w-13 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/80 transition-all duration-300 ${
                                                isDragging
                                                    ? 'scale-110 -rotate-6 text-red-600 ring-red-200'
                                                    : 'text-gray-500 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-red-600'
                                            }`}
                                        >
                                            <FiUpload className="h-5 w-5" />
                                        </div>

                                        <span className="text-sm font-bold text-gray-800">
                                            {isDragging ? 'تصویر را همین‌جا رها کن' : 'تصویر را بکش و رها کن یا کلیک کن'}
                                        </span>

                                        <span className="mt-1.5 text-xs text-gray-400">
                                            به‌صورت خودکار برای بارگذاری سریع بهینه‌سازی می‌شود
                                        </span>

                                        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5">
                                            {['JPG', 'PNG', 'WEBP', 'GIF'].map((ext) => (
                                                <span
                                                    key={ext}
                                                    className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-gray-400 ring-1 ring-gray-200/70"
                                                >
                                                    {ext}
                                                </span>
                                            ))}
                                            <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-gray-400 ring-1 ring-gray-200/70">
                                                تا ۱۰MB
                                            </span>
                                        </div>

                                        {isPreparing && (
                                            <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-xs ring-1 ring-red-100">
                                                <span className="h-3.5 w-3.5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                                                در حال آماده‌سازی تصویر...
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* ستون چپ: عنوان و توضیحات (هم‌ارتفاع با ستون تصویر) */}
                            <div className="lg:col-span-7 flex flex-col gap-5 p-5 sm:p-6">
                                {/* عنوان */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label
                                            htmlFor="pin-title"
                                            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800"
                                        >
                                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                                <FiType className="h-3.5 w-3.5" />
                                            </span>
                                            عنوان پین
                                            <span className="text-red-500">*</span>
                                        </label>
                                        <span className="text-[11px] text-gray-400 tabular-nums">
                                            {title.length.toLocaleString('fa-IR')} کاراکتر
                                        </span>
                                    </div>
                                    <input
                                        id="pin-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="مثلاً ایده طراحی مینیمال اتاق خواب"
                                        className="w-full rounded-2xl bg-gray-50/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                                            ring-1 ring-gray-200/80
                                            focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30
                                            transition-all"
                                    />
                                </div>

                                {/* توضیحات — کشیده می‌شود تا هم‌تراز کف باکس تصویر باشد */}
                                <div className="flex flex-1 flex-col">
                                    <div className="mb-2 flex items-center justify-between">
                                        <label
                                            htmlFor="pin-desc"
                                            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800"
                                        >
                                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                                <FiAlignLeft className="h-3.5 w-3.5" />
                                            </span>
                                            توضیحات
                                            <span className="text-[11px] font-normal text-gray-400">(اختیاری)</span>
                                        </label>
                                        <span
                                            className={`text-[11px] tabular-nums ${
                                                description.length > 0 ? 'font-semibold text-gray-600' : 'text-gray-300'
                                            }`}
                                        >
                                            {description.length.toLocaleString('fa-IR')}
                                        </span>
                                    </div>
                                    <textarea
                                        id="pin-desc"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="نکته، منبع یا توضیح کوتاهی درباره این پین بنویس..."
                                        className="w-full flex-1 min-h-[160px] rounded-2xl bg-gray-50/90 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400
                                            ring-1 ring-gray-200/80 leading-relaxed resize-none
                                            focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30
                                            transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ─── ردیف ۲: دسته‌بندی تمام‌عرض داخل همان باکس ─── */}
                        <div className="border-t border-gray-100 p-5 sm:p-6">
                            <div className="mb-3.5 flex items-center justify-between">
                                <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                        <FiTag className="h-3.5 w-3.5" />
                                    </span>
                                    انتخاب دسته‌بندی
                                </span>

                                {selectedCategoryObj && (
                                    <span
                                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                                        style={{
                                            backgroundColor: `${selectedCategoryObj.color}16`,
                                            color: selectedCategoryObj.color,
                                        }}
                                    >
                                        {selectedCategoryObj.name}
                                    </span>
                                )}
                            </div>

                            {loadingCategories ? (
                                <div className="flex flex-wrap gap-2">
                                    {Array.from({ length: 10 }).map((_, i) => (
                                        <div key={i} className="h-10 w-28 rounded-xl bg-gray-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => {
                                        const isActive = category === cat.slug
                                        const Icon = getCategoryIcon(cat.icon)

                                        return (
                                            <button
                                                key={cat.slug}
                                                type="button"
                                                onClick={() => setCategory(cat.slug)}
                                                style={
                                                    isActive
                                                        ? {
                                                              backgroundColor: `${cat.color}12`,
                                                              boxShadow: `inset 0 0 0 1.5px ${cat.color}`,
                                                          }
                                                        : undefined
                                                }
                                                className={`group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold
                                                    transition-all duration-200 cursor-pointer active:scale-[0.97] ${
                                                        isActive
                                                            ? 'text-gray-900 shadow-2xs'
                                                            : 'bg-gray-50/90 text-gray-600 ring-1 ring-gray-200/70 hover:bg-white hover:ring-gray-300 hover:text-gray-900'
                                                    }`}
                                            >
                                                <Icon
                                                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
                                                    style={{ color: isActive ? cat.color : '#6B7280' }}
                                                />
                                                <span>{cat.name}</span>
                                                {isActive && (
                                                    <span
                                                        className="flex h-4 w-4 items-center justify-center rounded-full text-white"
                                                        style={{ backgroundColor: cat.color }}
                                                    >
                                                        <FiCheck className="h-2.5 w-2.5 stroke-[3]" />
                                                    </span>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* ─── ردیف ۳: نوار دکمه‌ها چسبیده به کف باکس ─── */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-5 sm:px-6 py-4">
                            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
                                {!hasImage ? (
                                    <span>ابتدا یک تصویر انتخاب کنید</span>
                                ) : !hasTitle ? (
                                    <span>برای انتشار، یک عنوان کوتاه بنویسید</span>
                                ) : (
                                    <span className="flex items-center gap-1.5 font-semibold text-emerald-600">
                                        <FiCheckCircle className="h-4 w-4" />
                                        همه‌چیز آماده انتشار است
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Link
                                    href="/"
                                    className="shrink-0 rounded-xl bg-white hover:bg-gray-100 px-5 py-2.5 text-xs sm:text-sm font-bold text-gray-700 ring-1 ring-gray-200/90 transition-colors no-underline"
                                >
                                    انصراف
                                </Link>

                                <button
                                    type="submit"
                                    disabled={loading || isPreparing || !isFormValid}
                                    className="flex-1 sm:flex-initial sm:min-w-44 flex items-center justify-center gap-2 rounded-xl
                                        bg-gradient-to-r from-red-600 to-rose-600 py-2.5 px-6 text-xs sm:text-sm font-bold text-white
                                        shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30 hover:brightness-105
                                        active:scale-[0.98] transition-all cursor-pointer
                                        disabled:opacity-45 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100"
                                >
                                    {isPreparing ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            آماده‌سازی...
                                        </>
                                    ) : loading ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            در حال انتشار...
                                        </>
                                    ) : (
                                        <>
                                            <FiUpload className="h-4 w-4" />
                                            انتشار پین
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

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