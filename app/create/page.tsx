"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { FiUpload, FiImage, FiType, FiAlignLeft, FiAlertCircle, FiX, FiFile, FiCheckCircle, FiTag } from 'react-icons/fi'
import { compressImage } from '@/lib/imageCompress'
import { getCategoryIcon } from '@/lib/categories'

type CreatePinInput = {
    title: string
    description: string
    file: File
    width: number
    height: number
    category: string
}

export default function CreatePage() {
    const router = useRouter()
    const queryClient = useQueryClient()

    // ── State های UI ──
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
    const [previewUrl, setPreviewUrl] = useState('')
    const [isPreparing, setIsPreparing] = useState(false)
    const [submitError, setSubmitError] = useState('')
    const [compressionInfo, setCompressionInfo] = useState<{ from: number; to: number } | null>(null)
    const [category, setCategory] = useState('other')

    const createPinMutation = useMutation({
        mutationFn: async ({ title, description, file, width, height, category }: CreatePinInput) => {
            // ۱. آپلود تصویر (از قبل فشرده شده)
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

            // ۲. ساخت پین — با ابعاد واقعی از فشرده‌ساز + دسته‌بندی
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
            router.push('/')
        },
    })

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        e.target.value = ''
        setSubmitError('')

        setIsPreparing(true)
        try {
            const { file: compressed, width, height, wasCompressed } = await compressImage(file)

            if (previewUrl) URL.revokeObjectURL(previewUrl)

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

    const handleRemoveFile = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setSelectedFile(null)
        setDimensions(null)
        setPreviewUrl('')
        setCompressionInfo(null)
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

    const { data: categoriesData } = useQuery<{ categories: { slug: string; name: string; icon: string; color: string }[] }>({
        queryKey: ['categories-all'],
        queryFn: async () => {
            const res = await fetch('/api/categories')
            if (!res.ok) throw new Error('خطا')
            return res.json()
        },
        staleTime: 5 * 60 * 1000,
    })
    const categories = categoriesData?.categories ?? []

    const isFormValid = title.trim() && selectedFile && dimensions && !isPreparing
    const loading = createPinMutation.isPending
    const error = createPinMutation.error

    return (
        <main
            dir="rtl"
            className="relative min-h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-white to-red-50/40 px-4 py-8"
        >
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-[28rem] h-[28rem] bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

            {/* هدر */}
            <div className="flex items-center gap-4 mb-12">
                <div className="md:w-14 md:h-14 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg shadow-red-200/60 flex items-center justify-center shrink-0">
                    <FiUpload className="md:w-6 md:h-6 w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-xl md:text-3xl font-extrabold bg-gradient-to-l from-red-600 to-rose-600 bg-clip-text text-transparent tracking-tight">
                        ساخت پین جدید
                    </h1>
                    <p className="text-[10px] md:text-sm text-gray-500 mt-1">
                        یه تصویر انتخاب کن، دسته‌بندی کن و منتشرش کن
                    </p>
                </div>
            </div>

            <div className="relative max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ── خطای mutation ── */}
                    {error && (
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-red-200/80 text-red-600 px-5 py-4 rounded-2xl shadow-lg shadow-red-100/50 animate-[fadeInUp_0.3s_ease-out]">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <FiAlertCircle className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">
                                {(error as Error).message}
                            </span>
                        </div>
                    )}

                    {/* ── خطای فشرده‌سازی ── */}
                    {submitError && (
                        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-red-200/80 text-red-600 px-5 py-4 rounded-2xl shadow-lg shadow-red-100/50 animate-[fadeInUp_0.3s_ease-out]">
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <FiAlertCircle className="w-5 h-5" />
                            </div>
                            <span className="font-semibold text-sm">{submitError}</span>
                        </div>
                    )}

                    {/* ── کارت اصلی ── */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden">
                        <div className="h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-400" />

                        <div className="p-5 md:p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-8">
                                {/* ═══ ۱. آپلود تصویر ═══ */}
                                <div>
                                    <div className="flex items-center justify-between mb-2.5">
                                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                            <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۱</span>
                                            <FiImage className="w-4 h-4 text-gray-400" />
                                            تصویر
                                        </label>
                                        {previewUrl && (
                                            <span className="flex items-center gap-1 text-xs font-bold text-green-600">
                                                <FiCheckCircle className="w-3.5 h-3.5" />
                                                انتخاب شد
                                            </span>
                                        )}
                                    </div>

                                    <label className="group relative block w-full rounded-2xl cursor-pointer overflow-hidden bg-gray-50 border-2 border-dashed transition-all duration-300 border-gray-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-100/40">
                                        {previewUrl ? (
                                            <>
                                                <img
                                                    src={previewUrl}
                                                    alt="پیش‌نمایش"
                                                    className="w-full h-auto max-h-[65vh] object-contain"
                                                />

                                                <span className="absolute top-3 left-3 flex items-center gap-1.5 text-white text-xs font-bold
                                                    bg-black/55 hover:bg-black/70 backdrop-blur-md px-3.5 py-2 rounded-full
                                                    ring-1 ring-white/30 shadow-lg transition-all duration-200
                                                    opacity-0 group-hover:opacity-100">
                                                    <FiUpload className="w-3.5 h-3.5" />
                                                    تغییر تصویر
                                                </span>

                                                {isPreparing && (
                                                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                                                        <span className="w-6 h-6 border-[3px] border-red-100 border-t-red-500 rounded-full animate-spin" />
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center px-6 text-center aspect-[4/5]">
                                                <div className="relative mb-4">
                                                    <div className="absolute inset-0 bg-red-200/50 rounded-full blur-xl scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    <div className="relative w-16 h-16 rounded-2xl bg-white shadow-md ring-1 ring-black/5 flex items-center justify-center mb-1 group-hover:scale-110 group-hover:-rotate-6 group-hover:text-red-500 transition-all duration-300">
                                                        <FiUpload className="text-2xl" />
                                                    </div>
                                                </div>
                                                <span className="text-sm font-bold text-gray-700">
                                                    برای انتخاب تصویر کلیک کن
                                                </span>
                                                <span className="text-xs text-gray-400 mt-1.5 bg-white ring-1 ring-gray-100 px-2.5 py-1 rounded-full">
                                                    PNG، JPG یا GIF — تا ۱۰ مگابایت
                                                </span>

                                                {isPreparing && (
                                                    <span className="mt-3 flex items-center gap-2 text-xs font-bold text-red-500">
                                                        <span className="w-4 h-4 border-2 border-red-100 border-t-red-500 rounded-full animate-spin" />
                                                        در حال آماده‌سازی تصویر...
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>

                                    {selectedFile && (
                                        <div className="mt-3 flex items-center gap-2.5 bg-gray-50 ring-1 ring-gray-100 rounded-xl px-3 py-2.5 animate-[fadeInUp_0.25s_ease-out]">
                                            <div className="w-8 h-8 rounded-lg bg-white ring-1 ring-gray-200 flex items-center justify-center shrink-0">
                                                <FiFile className="w-4 h-4 text-red-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-gray-700 truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-[11px] text-gray-400 tabular-nums">
                                                    {formatFileSize(selectedFile.size)}
                                                    {compressionInfo && (
                                                        <span className="text-green-600 font-bold">
                                                            {' '}· فشرده شد از {formatFileSize(compressionInfo.from)} ✓
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    handleRemoveFile()
                                                }}
                                                title="حذف تصویر"
                                                className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer active:scale-90"
                                            >
                                                <FiX className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ═══ ستون اطلاعات: عنوان + توضیحات ═══ */}
                                <div className="flex flex-col gap-6">
                                    {/* ── ۲. عنوان پین ── */}
                                    <div>
                                        <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2.5">
                                            <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۲</span>
                                            <FiType className="w-4 h-4 text-gray-400" />
                                            عنوان پین
                                        </label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            placeholder="مثلاً ایده طراحی اتاق خواب"
                                            className="w-full placeholder:text-sm bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all duration-200"
                                        />
                                    </div>

                                    {/* ── ۴. توضیحات ── */}
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                                                <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۴</span>
                                                <FiAlignLeft className="w-4 h-4 text-gray-400" />
                                                توضیحات
                                                <span className="text-gray-400 font-normal">(اختیاری)</span>
                                            </label>
                                            <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full transition-colors ${description.length > 0
                                                ? 'bg-red-50 text-red-500 ring-1 ring-red-100'
                                                : 'bg-gray-50 text-gray-300 ring-1 ring-gray-100'
                                                }`}>
                                                {description.length}
                                            </span>
                                        </div>
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={6}
                                            placeholder="درباره این پین بنویس..."
                                            className="w-full flex-1 bg-gray-50 border-2 border-transparent rounded-2xl px-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-red-300 focus:ring-4 focus:ring-red-50 transition-all duration-200 resize-none leading-relaxed"
                                        />
                                    </div>
                                </div>

                                {/* ═══ ۳. دسته‌بندی — تمام‌عرض، برادر مستقل ═══ */}
                                <div className="lg:col-span-2">
                                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 mb-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-[11px] font-extrabold">۳</span>
                                        <FiTag className="w-4 h-4 text-gray-400" />
                                        دسته‌بندی
                                    </label>

                                    <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
                                        {categories.map((cat) => {
                                            const isActive = category === cat.slug
                                            const Icon = getCategoryIcon(cat.icon)

                                            return (
                                                <button
                                                    key={cat.slug}
                                                    type="button"
                                                    onClick={() => setCategory(cat.slug)}
                                                    className={`flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl
                                                        transition-all duration-200 cursor-pointer text-center
                                                        ${isActive
                                                            ? 'shadow-md'
                                                            : 'ring-1 ring-gray-100 bg-gray-50 hover:bg-gray-100 hover:ring-gray-200'
                                                        }`}
                                                    style={isActive ? {
                                                        backgroundColor: `${cat.color}14`,
                                                        boxShadow: `0 0 0 2px ${cat.color}`,
                                                    } : undefined}
                                                >
                                                    <Icon
                                                        className="w-5 h-5"
                                                        style={{ color: isActive ? cat.color : undefined }}
                                                    />
                                                    <span className={`text-[10px] font-bold leading-tight
                                                        ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                                        {cat.name}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── نوار دکمه‌ها ── */}
                    <div className="sticky bottom-4 z-30 mb-24 md:mb-0">
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl ring-1 ring-black/5 shadow-2xl shadow-gray-300/40 p-3 flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={loading || isPreparing || !isFormValid}
                                className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-red-200/70 hover:shadow-xl hover:shadow-red-300/60 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:brightness-100 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {isPreparing ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        آماده‌سازی تصویر...
                                    </>
                                ) : loading ? (
                                    <>
                                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                        در حال ساخت...
                                    </>
                                ) : (
                                    <>
                                        <FiUpload className="w-4 h-4" />
                                        انتشار پین
                                    </>
                                )}
                            </button>

                            <Link
                                href="/"
                                className="shrink-0 px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm transition-colors no-underline"
                            >
                                انصراف
                            </Link>
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
                    * { animation: none !important; }
                }
            `}</style>
        </main>
    )
}