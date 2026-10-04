"use client"

import { useState } from 'react'
import { FiX, FiSave, FiAlertCircle } from 'react-icons/fi'
import { ICON_REGISTRY, getCategoryIcon } from '@/lib/categories'

type AdminCategoryModalProps = {
    category: {
        id: string
        slug: string
        name: string
        icon: string
        color: string
    } | null
    onClose: () => void
    onSaved: (message: string) => void
}

export default function AdminCategoryModal({
    category,
    onClose,
    onSaved,
}: AdminCategoryModalProps) {
    const isEdit = !!category

    const [name, setName] = useState(category?.name || '')
    const [slug, setSlug] = useState(category?.slug || '')
    const [icon, setIcon] = useState(category?.icon || 'LuTag')
    const [color, setColor] = useState(category?.color || '#9ca3af')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const SelectedIcon = getCategoryIcon(icon)

    const handleSave = async () => {
        if (!name.trim() || !slug.trim()) {
            setError('نام و slug الزامی است')
            return
        }

        setSaving(true)
        setError('')

        try {
            const url = isEdit
                ? `/api/admin/categories/${category!.id}`
                : '/api/admin/categories'
            const method = isEdit ? 'PATCH' : 'POST'

            const body: Record<string, unknown> = { name, icon, color }
            if (!isEdit) body.slug = slug

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ذخیره')
            }

            const data = await res.json()
            onSaved(data.message || 'دسته‌بندی ذخیره شد')
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px]
            flex items-end sm:items-center justify-center sm:p-4">
            <div className="bg-white shadow-2xl w-full sm:max-w-lg
                rounded-t-3xl sm:rounded-3xl overflow-hidden
                animate-[sheetUp_0.3s_cubic-bezier(0.32,0.72,0,1)]
                max-h-[92dvh] flex flex-col">

                {/* ═══ هدر ═══ */}
                <div className="shrink-0 flex items-center justify-between px-5 sm:px-6 pt-5 pb-3">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                        {isEdit ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center
                            text-gray-400 hover:bg-gray-100 hover:text-gray-700
                            transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {/* ═══ بدنه اسکرول‌شونده ═══ */}
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 pb-4
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-thumb]:bg-gray-200
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    [&::-webkit-scrollbar-track]:bg-transparent">

                    {/* ═══ ۱. پیش‌نمایش زنده — badge واقعی که می‌سازی ═══ */}
                    <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm pb-4 -mt-1 pt-1">
                        <div className="flex items-center gap-3.5 bg-gray-50 rounded-2xl p-3.5 ring-1 ring-gray-100">
                            {/* آیکون — همونی که انتخاب می‌کنی */}
                            <span
                                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                    transition-all duration-300"
                                style={{ backgroundColor: `${color}18` }}
                            >
                                <SelectedIcon
                                    className="w-6 h-6 transition-colors duration-300"
                                    style={{ color }}
                                />
                            </span>

                            <div className="flex-1 min-w-0 text-right">
                                {/* متن زنده — همون چیزی که تایپ می‌کنی */}
                                <p className="font-bold text-sm text-gray-900 truncate">
                                    {name.trim() || 'نام دسته...'}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate">
                                    /category/{slug.trim() || 'slug'}
                                </p>
                            </div>

                            {/* نقطه رنگی — مثل badge کارت */}
                            <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300"
                                style={{ backgroundColor: color }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600
                            px-4 py-2.5 rounded-xl text-sm mb-4">
                            <FiAlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* ═══ ۲. نام + slug — یه ردیف فشرده ═══ */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">نام</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="مثلاً آشپزی"
                                    className="w-full border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900
                                        focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                                    لینک{' '}
                                    {isEdit && (
                                        <span className="text-gray-300 font-normal">(قابل تغییر نیست)</span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value.toLowerCase())}
                                    dir="ltr"
                                    placeholder="cooking"
                                    disabled={isEdit}   // 🔒 اسلاگ پس از ساخت قفل است — URL نمی‌شکند
                                    className={`w-full border-2 border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-900
                                        focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100/50 transition-all text-left
                                        ${isEdit ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}
                                />
                            </div>
                        </div>

                        {/* ═══ ۳. آیکون‌گرید ═══ */}
                        <div>
                            <label className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
                                آیکون
                                <span className="text-[10px] text-gray-300 font-normal tabular-nums">
                                    {Object.keys(ICON_REGISTRY).length.toLocaleString('fa-IR')} گزینه
                                </span>
                            </label>
                            <div className="grid grid-cols-8 sm:grid-cols-9 gap-1.5 max-h-40 overflow-y-auto p-2
                                bg-gray-50 rounded-2xl ring-1 ring-gray-100
                                [&::-webkit-scrollbar]:w-1.5
                                [&::-webkit-scrollbar-thumb]:bg-gray-200
                                [&::-webkit-scrollbar-thumb]:rounded-full
                                [&::-webkit-scrollbar-track]:bg-transparent">
                                {Object.entries(ICON_REGISTRY).map(([iconName, Icon]) => (
                                    <button
                                        key={iconName}
                                        type="button"
                                        onClick={() => setIcon(iconName)}
                                        title={iconName}
                                        className={`aspect-square rounded-lg flex items-center justify-center
                                            transition-all duration-150 cursor-pointer
                                            ${icon === iconName
                                                ? 'bg-gray-900 text-white scale-110 shadow-md'
                                                : 'bg-white text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-sm hover:scale-105'
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ═══ ۴. رنگ ═══ */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">رنگ هویتی</label>
                            <div className="flex items-center gap-2.5">
                                <input
                                    type="color"
                                    value={color}
                                    onChange={(e) => setColor(e.target.value)}
                                    className="w-11 h-11 rounded-xl cursor-pointer border-2 border-gray-200 p-1 bg-white
                                        hover:border-gray-300 transition-colors"
                                />

                                {/* رنگ‌های پیشنهادی سریع */}
                                <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                                    {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b','#311B92','#FFEB3B','#F48FB1'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            aria-label={`رنگ ${c}`}
                                            className={`w-7 h-7 rounded-full transition-all cursor-pointer
                                                hover:scale-110 active:scale-95
                                                ${color.toLowerCase() === c ? 'ring-2 ring-offset-2 ring-gray-900' : 'ring-1 ring-black/10'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ فوتر — دکمه‌ها ═══ */}
                <div className="shrink-0 px-5 sm:px-6 py-4 border-t border-gray-100
                    flex items-center gap-2.5
                    pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm
                            transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim() || !slug.trim()}
                        className="flex-1 h-11 bg-gray-900 hover:bg-black text-white rounded-xl font-semibold text-sm
                            transition-all disabled:opacity-40 disabled:cursor-not-allowed
                            cursor-pointer flex items-center justify-center gap-2
                            hover:shadow-lg active:scale-[0.98]"
                    >
                        {saving ? (
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FiSave className="w-4 h-4" />
                        )}
                        ذخیره
                    </button>
                </div>
            </div>
        </div>
    )
}