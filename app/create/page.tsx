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
    FiClock,
    FiPlus,
    FiChevronLeft,
    FiChevronRight,
    FiLayers,
    FiStar,
} from 'react-icons/fi'
import { compressImage } from '@/lib/imageCompress'
import { getCategoryIcon } from '@/lib/categories'
import { useAuthStore } from '@/lib/authStore'
import AuthGate from '../components/AuthGate'

const MAX_PIN_IMAGES = 6

type SelectedSlide = {
    id: string
    file: File
    previewUrl: string
    width: number
    height: number
    originalSize: number
    compressedSize: number
    wasCompressed: boolean
}

type CreatePinInput = {
    title: string
    description: string
    slides: SelectedSlide[]
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

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [slides, setSlides] = useState<SelectedSlide[]>([])
    const [activeSlideIdx, setActiveSlideIdx] = useState(0)
    const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
    const [isPreparing, setIsPreparing] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [category, setCategory] = useState('other')
    const [createdPinResult, setCreatedPinResult] = useState<{
        id: string
        title: string
        status: string
    } | null>(null)

    const slidesRef = useRef<SelectedSlide[]>([])
    useEffect(() => {
        slidesRef.current = slides
    }, [slides])

    useEffect(() => {
        return () => {
            slidesRef.current.forEach((s) => URL.revokeObjectURL(s.previewUrl))
        }
    }, [])

    const createPinMutation = useMutation({
        mutationFn: async ({ title, description, slides: targetSlides, category }: CreatePinInput) => {
            const uploadedImages: { imageUrl: string; width: number; height: number }[] = []

            for (let i = 0; i < targetSlides.length; i++) {
                setUploadProgress({ current: i + 1, total: targetSlides.length })
                const slide = targetSlides[i]
                const formData = new FormData()
                formData.append('file', slide.file)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                if (!uploadRes.ok) {
                    const data = await uploadRes.json()
                    throw new Error(data.error || `خطا در آپلود تصویر ${i + 1}`)
                }

                const { imageUrl } = await uploadRes.json()
                uploadedImages.push({
                    imageUrl,
                    width: slide.width,
                    height: slide.height,
                })
            }

            setUploadProgress(null)

            const pinRes = await fetch('/api/pins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    imageUrl: uploadedImages[0].imageUrl,
                    imageWidth: uploadedImages[0].width,
                    imageHeight: uploadedImages[0].height,
                    images: uploadedImages,
                    category,
                }),
            })

            if (!pinRes.ok) {
                const data = await pinRes.json()
                throw new Error(data.error || 'خطا در ساخت پین')
            }

            return pinRes.json()
        },
        onSuccess: (data: { id: string; title: string; status?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['pins'], refetchType: 'all' })
            queryClient.invalidateQueries({ queryKey: ['my-pins'], refetchType: 'all' })
            queryClient.invalidateQueries({ queryKey: ['categories-all'] })

            if (data.status === 'APPROVED') {
                router.push(`/pin/${data.id}`)
            } else {
                setCreatedPinResult({
                    id: data.id,
                    title: data.title,
                    status: data.status || 'PENDING',
                })
            }
        },
        onSettled: () => {
            setUploadProgress(null)
        },
    })

    const handleResetForm = () => {
        setTitle('')
        setDescription('')
        slides.forEach((s) => URL.revokeObjectURL(s.previewUrl))
        setSlides([])
        setActiveSlideIdx(0)
        setUploadProgress(null)
        setSubmitError('')
        setCreatedPinResult(null)
    }

    const processFiles = async (fileList: FileList | File[]) => {
        const incoming = Array.from(fileList)
        if (incoming.length === 0) return

        const remainingSlots = MAX_PIN_IMAGES - slides.length
        if (remainingSlots <= 0) {
            setSubmitError(`حداکثر ${MAX_PIN_IMAGES.toLocaleString('fa-IR')} تصویر برای هر پین مجاز است`)
            return
        }

        const validImages = incoming.filter((f) => f.type.startsWith('image/'))
        if (validImages.length === 0) {
            setSubmitError('لطفاً فقط فایل تصویری (PNG، JPG، WEBP یا GIF) انتخاب کنید')
            return
        }

        const filesToProcess = validImages.slice(0, remainingSlots)
        if (validImages.length > remainingSlots) {
            setSubmitError(`حداکثر ${MAX_PIN_IMAGES.toLocaleString('fa-IR')} تصویر مجاز است؛ ${remainingSlots.toLocaleString('fa-IR')} تصویر اول اضافه شد.`)
        } else {
            setSubmitError('')
        }

        setIsPreparing(true)
        try {
            const prepared: SelectedSlide[] = []
            for (const file of filesToProcess) {
                const { file: compressed, width, height, wasCompressed } = await compressImage(file)
                prepared.push({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    file: compressed,
                    previewUrl: URL.createObjectURL(compressed),
                    width,
                    height,
                    originalSize: file.size,
                    compressedSize: compressed.size,
                    wasCompressed,
                })
            }

            setSlides((prev) => {
                const next = [...prev, ...prepared]
                setActiveSlideIdx(prev.length)
                return next
            })
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'خطا در پردازش تصویر')
        } finally {
            setIsPreparing(false)
        }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return
        const copied = Array.from(files)
        e.target.value = ''
        await processFiles(copied)
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
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFiles(e.dataTransfer.files)
        }
    }

    const handleRemoveSlide = (index: number) => {
        setSlides((prev) => {
            const target = prev[index]
            if (target) URL.revokeObjectURL(target.previewUrl)
            const next = prev.filter((_, i) => i !== index)
            setActiveSlideIdx((curr) => {
                if (next.length === 0) return 0
                if (curr >= next.length) return next.length - 1
                if (index < curr) return curr - 1
                return curr
            })
            return next
        })
        setSubmitError('')
    }

    const handleMakeCover = (index: number) => {
        if (index <= 0 || index >= slides.length) return
        setSlides((prev) => {
            const copy = [...prev]
            const [picked] = copy.splice(index, 1)
            copy.unshift(picked)
            return copy
        })
        setActiveSlideIdx(0)
    }

    const handleMoveSlide = (fromIndex: number, direction: -1 | 1) => {
        const toIndex = fromIndex + direction
        if (toIndex < 0 || toIndex >= slides.length) return
        setSlides((prev) => {
            const copy = [...prev]
            const temp = copy[fromIndex]
            copy[fromIndex] = copy[toIndex]
            copy[toIndex] = temp
            return copy
        })
        setActiveSlideIdx(toIndex)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim() || slides.length === 0) return

        createPinMutation.mutate({
            title: title.trim(),
            description: description.trim(),
            slides,
            category,
        })
    }

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} بایت`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} کیلوبایت`
        return `${(bytes / (1024 * 1024)).toFixed(1)} مگابایت`
    }

    const activeSlide = slides[activeSlideIdx] || slides[0] || null
    const savedPercent = activeSlide?.wasCompressed
        ? Math.max(1, Math.round((1 - activeSlide.compressedSize / activeSlide.originalSize) * 100))
        : null

    const hasImage = slides.length > 0
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
            <AuthGate
                icon={FiUpload}
                title="ساخت پین جدید"
                description="برای اشتراک‌گذاری ایده‌ها و تصاویر خود در Pinverse، ابتدا وارد حساب کاربری شوید."
                redirectUrl="/create"
            />
        )
    }

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-[#FAFAFB] px-4 sm:px-6 py-6 sm:py-8 pb-24 lg:pb-12"
        >
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-28 right-1/4 h-80 w-80 rounded-full bg-rose-200/30 blur-3xl"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-10 -left-24 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl"
            />

            <div className="relative mx-auto max-w-5xl">
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

                    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-200/80 shadow-sm">
                        <div className="h-1 bg-gradient-to-l from-red-500 via-rose-500 to-orange-400" />

                        <div className="grid grid-cols-1 lg:grid-cols-12">
                            <div className="lg:col-span-5 flex flex-col p-5 sm:p-6 border-b lg:border-b-0 lg:border-l border-gray-100">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <span className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-800">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600">
                                            <FiLayers className="h-3.5 w-3.5" />
                                        </span>
                                        تصاویر پین
                                        <span className="text-red-500">*</span>
                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500 tabular-nums">
                                            {slides.length.toLocaleString('fa-IR')} / {MAX_PIN_IMAGES.toLocaleString('fa-IR')}
                                        </span>
                                    </span>

                                    {activeSlide && (
                                        <span
                                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 tabular-nums"
                                            dir="ltr"
                                        >
                                            {activeSlide.width} × {activeSlide.height}
                                        </span>
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {activeSlide ? (
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
                                                src={activeSlide.previewUrl}
                                                alt={`پیش‌نمایش اسلاید ${activeSlideIdx + 1}`}
                                                className="max-h-[340px] w-full object-contain"
                                            />

                                            <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1.5">
                                                    {activeSlideIdx === 0 ? (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 backdrop-blur-md px-2.5 py-1 text-[10px] font-black text-white shadow-md">
                                                            <FiStar className="h-3 w-3" />
                                                            کاور اصلی
                                                        </span>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleMakeCover(activeSlideIdx)}
                                                            className="inline-flex items-center gap-1 rounded-full bg-gray-900/75 hover:bg-amber-600 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white shadow-md transition-all cursor-pointer active:scale-95"
                                                        >
                                                            <FiStar className="h-3 w-3" />
                                                            انتخاب به‌عنوان کاور
                                                        </button>
                                                    )}

                                                    {slides.length > 1 && (
                                                        <span className="rounded-full bg-black/55 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white tabular-nums">
                                                            {(activeSlideIdx + 1).toLocaleString('fa-IR')} / {slides.length.toLocaleString('fa-IR')}
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSlide(activeSlideIdx)}
                                                    aria-label="حذف این تصویر"
                                                    className="flex h-8 w-8 items-center justify-center rounded-full
                                                        bg-white/90 hover:bg-red-600 text-gray-600 hover:text-white
                                                        backdrop-blur-md shadow-md ring-1 ring-black/5
                                                        transition-all active:scale-90 cursor-pointer"
                                                >
                                                    <FiTrash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>

                                            {slides.length > 1 && (
                                                <>
                                                    {activeSlideIdx > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveSlideIdx((i) => Math.max(0, i - 1))}
                                                            aria-label="اسلاید قبلی"
                                                            className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md ring-1 ring-black/10 transition-all cursor-pointer active:scale-90"
                                                        >
                                                            <FiChevronLeft className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {activeSlideIdx < slides.length - 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveSlideIdx((i) => Math.min(slides.length - 1, i + 1))}
                                                            aria-label="اسلاید بعدی"
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-800 shadow-md ring-1 ring-black/10 transition-all cursor-pointer active:scale-90"
                                                        >
                                                            <FiChevronRight className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {isPreparing && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 backdrop-blur-sm z-10">
                                                    <span className="h-6 w-6 border-[3px] border-red-100 border-t-red-600 rounded-full animate-spin" />
                                                    <span className="text-xs font-bold text-gray-700">در حال بهینه‌سازی تصاویر...</span>
                                                </div>
                                            )}
                                        </div>

                                        <div
                                            dir="ltr"
                                            className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 px-1.5"
                                        >
                                            {slides.map((s, idx) => {
                                                const isActive = idx === activeSlideIdx
                                                return (
                                                    <div key={s.id} className="relative shrink-0 group/thumb">
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveSlideIdx(idx)}
                                                            className={`relative h-14 w-14 overflow-hidden rounded-xl transition-all cursor-pointer block ${
                                                                isActive
                                                                    ? 'ring-2 ring-red-600 ring-offset-2 scale-[1.03]'
                                                                    : 'opacity-70 hover:opacity-100 ring-1 ring-gray-200'
                                                            }`}
                                                        >
                                                            <img
                                                                src={s.previewUrl}
                                                                alt={`اسلاید ${idx + 1}`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                            {idx === 0 && (
                                                                <span className="absolute bottom-0 inset-x-0 bg-amber-500/90 text-[8px] font-black text-white text-center py-0.5">
                                                                    کاور
                                                                </span>
                                                            )}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRemoveSlide(idx)
                                                            }}
                                                            aria-label="حذف"
                                                            className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900 text-white shadow-sm opacity-90 sm:opacity-0 sm:group-hover/thumb:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                                                        >
                                                            <FiX className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )
                                            })}

                                            {slides.length < MAX_PIN_IMAGES && (
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isPreparing}
                                                    className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/80 text-gray-500 hover:border-red-400 hover:bg-red-50/40 hover:text-red-600 transition-all cursor-pointer disabled:opacity-50"
                                                >
                                                    <FiPlus className="h-4 w-4" />
                                                    <span className="text-[9px] font-bold">افزودن</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between gap-2 rounded-xl bg-gray-50 px-3 py-2 ring-1 ring-gray-200/60">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-red-500 ring-1 ring-gray-200/80">
                                                    <FiFile className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-bold text-gray-800 max-w-[160px] sm:max-w-[200px]">
                                                        {activeSlide.file.name}
                                                    </p>
                                                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400 tabular-nums">
                                                        <span>{formatFileSize(activeSlide.compressedSize)}</span>
                                                        {savedPercent && (
                                                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                                                                {savedPercent.toLocaleString('fa-IR')}٪ سبک‌تر شد
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {slides.length > 1 && (
                                                <div className="flex items-center gap-1 shrink-0" dir="ltr">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveSlide(activeSlideIdx, -1)}
                                                        disabled={activeSlideIdx === 0}
                                                        title="انتقال به قبل"
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 disabled:opacity-35 cursor-pointer"
                                                    >
                                                        <FiChevronLeft className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMoveSlide(activeSlideIdx, 1)}
                                                        disabled={activeSlideIdx === slides.length - 1}
                                                        title="انتقال به بعد"
                                                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-100 disabled:opacity-35 cursor-pointer"
                                                    >
                                                        <FiChevronRight className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
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
                                            {isDragging
                                                ? 'تصاویر را همین‌جا رها کن'
                                                : 'یک یا چند تصویر بکش و رها کن یا کلیک کن'}
                                        </span>

                                        <span className="mt-1.5 text-xs text-gray-400">
                                            تا {MAX_PIN_IMAGES.toLocaleString('fa-IR')} تصویر به‌صورت اسلایدر با بهینه‌سازی خودکار
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
                                                حداکثر {MAX_PIN_IMAGES.toLocaleString('fa-IR')} عکس
                                            </span>
                                        </div>

                                        {isPreparing && (
                                            <div className="mt-4 flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-red-600 shadow-xs ring-1 ring-red-100">
                                                <span className="h-3.5 w-3.5 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                                                در حال آماده‌سازی تصاویر...
                                            </div>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="lg:col-span-7 flex flex-col gap-5 p-5 sm:p-6">
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
                                    ) : uploadProgress ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            آپلود تصویر {uploadProgress.current.toLocaleString('fa-IR')} از {uploadProgress.total.toLocaleString('fa-IR')}...
                                        </>
                                    ) : loading ? (
                                        <>
                                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                            در حال ثبت پین...
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

            {createdPinResult && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-[fadeIn_0.2s_ease-out]"
                >
                    <div
                        dir="rtl"
                        className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl ring-1 ring-black/5 animate-[scaleUp_0.25s_ease-out] text-center"
                    >
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-xl shadow-amber-500/30">
                            <FiClock className="h-8 w-8 animate-pulse" />
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            <span>در انتظار تایید مدیر</span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-black text-gray-900">
                            پین شما با موفقیت ثبت شد!
                        </h3>

                        <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                            پین «<strong className="font-bold text-gray-900">{createdPinResult.title}</strong>» با موفقیت در صف بررسی قرار گرفت و پس از تایید توسط مدیران، برای تمامی کاربران در صفحه اصلی منتشر خواهد شد.
                        </p>

                        <div className="mt-6 flex flex-col gap-2.5">
                            <Link
                                href="/myboards"
                                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 hover:bg-black py-3 text-xs sm:text-sm font-bold text-white transition-all shadow-md active:scale-[0.98] no-underline"
                            >
                                <FiImage className="h-4 w-4" />
                                <span>مشاهده در پین‌های من</span>
                            </Link>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleResetForm}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                                >
                                    <FiRefreshCw className="h-3.5 w-3.5" />
                                    <span>ساخت پین جدید</span>
                                </button>
                                <Link
                                    href="/"
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-gray-100 hover:bg-gray-200 py-2.5 text-xs font-bold text-gray-700 transition-colors no-underline"
                                >
                                    <FiArrowRight className="h-3.5 w-3.5" />
                                    <span>صفحه اصلی</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
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