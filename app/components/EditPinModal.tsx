"use client"

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FiX, FiCheck, FiTag, FiAlertCircle } from 'react-icons/fi'
import { getCategoryIcon } from '@/lib/categories'

type CategoryItem = {
    id: string
    slug: string
    name: string
    icon: string
    color: string
}

type Props = {
    pinId: string
    initialTitle: string
    initialDescription?: string
    initialCategory?: string
    onClose: () => void
    onSuccess?: (updated: any) => void
}

export default function EditPinModal({
    pinId,
    initialTitle,
    initialDescription = '',
    initialCategory = '',
    onClose,
    onSuccess,
}: Props) {
    const router = useRouter()
    const queryClient = useQueryClient()

    const [mounted, setMounted] = useState(false)
    const [title, setTitle] = useState(initialTitle)
    const [description, setDescription] = useState(initialDescription)
    const [category, setCategory] = useState(initialCategory)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        setMounted(true)
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prevOverflow
        }
    }, [])

    const { data: categoriesData, isLoading: loadingCategories } = useQuery<{
        categories: CategoryItem[]
    }>({
        queryKey: ['categories-all'],
        queryFn: async () => {
            const res = await fetch('/api/categories', { cache: 'no-store' })
            if (!res.ok) throw new Error('خطا در دریافت دسته‌بندی‌ها')
            return res.json()
        },
    })

    const categories = categoriesData?.categories ?? []
    const selectedCategoryObj = categories.find((c) => c.slug === category)

    const handleSave = async () => {
        if (!title.trim()) {
            setError('عنوان پین نمی‌تواند خالی باشد')
            return
        }

        setSaving(true)
        setError('')
        try {
            const res = await fetch(`/api/pins/${pinId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim(),
                    category,
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'خطا در ویرایش پین')

            queryClient.invalidateQueries({ queryKey: ['pin', pinId] })
            queryClient.invalidateQueries({ queryKey: ['pins'] })
            queryClient.invalidateQueries({ queryKey: ['my-pins'] })
            queryClient.invalidateQueries({ queryKey: ['categories-all'] })

            router.refresh()
            onSuccess?.(data.pin)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در ویرایش')
        } finally {
            setSaving(false)
        }
    }

    if (!mounted) return null

    const modalContent = (
        <div
            className="fixed inset-0 z-[99999] w-screen h-screen min-h-dvh bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
        >
            <div
                dir="rtl"
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] flex flex-col overflow-hidden animate-[scaleUp_0.2s_ease-out] my-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <FiTag className="w-4 h-4" />
                        </span>
                        <h2 className="text-base sm:text-lg font-black text-gray-900">
                            ویرایش مشخصات پین
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium">
                            <FiAlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            عنوان پین <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-medium"
                            placeholder="یک عنوان جذاب برای پین..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            توضیحات (اختیاری)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all resize-none font-medium leading-relaxed"
                            placeholder="درباره این تصویر و محتوای آن توضیح دهید..."
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                                <span>دسته‌بندی پین</span>
                                <span className="text-gray-400 font-normal text-[11px]">(انتخاب یک دسته)</span>
                            </label>
                            {selectedCategoryObj && (
                                <span
                                    className="rounded-full px-2.5 py-0.5 text-[11px] font-bold flex items-center gap-1"
                                    style={{
                                        backgroundColor: `${selectedCategoryObj.color}15`,
                                        color: selectedCategoryObj.color,
                                    }}
                                >
                                    <FiCheck className="w-3 h-3" />
                                    {selectedCategoryObj.name}
                                </span>
                            )}
                        </div>

                        {loadingCategories ? (
                            <div className="flex flex-wrap gap-1.5">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-8 w-20 rounded-xl bg-gray-100 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 bg-gray-50/80 rounded-2xl ring-1 ring-gray-100 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                                {categories.map((cat) => {
                                    const isSelected = category === cat.slug
                                    const Icon = getCategoryIcon(cat.icon)

                                    return (
                                        <button
                                            key={cat.slug}
                                            type="button"
                                            onClick={() => setCategory(cat.slug)}
                                            style={
                                                isSelected
                                                    ? {
                                                          backgroundColor: `${cat.color}18`,
                                                          color: cat.color,
                                                          borderColor: cat.color,
                                                      }
                                                    : undefined
                                            }
                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                                                isSelected
                                                    ? 'shadow-sm ring-2 ring-offset-1'
                                                    : 'bg-white text-gray-600 border-gray-200/80 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                        >
                                            <Icon className="w-3.5 h-3.5 shrink-0" />
                                            <span>{cat.name}</span>
                                            {isSelected && <FiCheck className="w-3 h-3 shrink-0 mr-0.5" />}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-2.5 px-5 sm:px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-md shadow-red-200 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>در حال ذخیره...</span>
                            </>
                        ) : (
                            <span>ذخیره تغییرات</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-11 px-5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl font-bold text-sm transition-all cursor-pointer"
                    >
                        انصراف
                    </button>
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
