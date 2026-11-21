"use client"

import { useState } from 'react'
import { FiX, FiLock } from 'react-icons/fi'

type Board = {
    id: string
    name: string
    isPrivate?: boolean
}

type Props = {
    editingBoard: Board | null   // null یعنی ساخت جدید
    onClose: () => void
    onSave: () => void            // بعد از موفقیت، والد رو خبر کن
}

export default function CreateEditBoardModal({ editingBoard, onClose, onSave }: Props) {
    const [boardName, setBoardName] = useState(editingBoard?.name || '')
    const [boardIsPrivate, setBoardIsPrivate] = useState(editingBoard?.isPrivate || false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const handleSave = async () => {
        if (!boardName.trim()) return
        setSaving(true)
        setError('')

        try {
            const url = editingBoard
                ? `/api/boards/${editingBoard.id}`
                : '/api/boards'
            const method = editingBoard ? 'PATCH' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: boardName,
                    isPrivate: boardIsPrivate,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در ذخیره برد')
            }

            onSave()       // والد رو خبر کن که برد ذخیره شد
            onClose()      // مودال رو ببند
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        {editingBoard ? 'ویرایش برد' : 'ساخت برد جدید'}
                    </h2>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                    >
                        <FiX className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm mb-4">
                        {error}
                    </div>
                )}

                <label className="block text-xs font-semibold text-gray-500 mb-1.5">نام برد</label>
                <input
                    type="text"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                    placeholder="مثلاً ایده‌های سفر"
                    className="w-full border-2 border-gray-200 placeholder:text-sm rounded-xl px-4 py-3 mb-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-100 transition-all"
                    autoFocus
                />

                <label className="flex items-center gap-2.5 mb-6 px-3.5 py-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                        type="checkbox"
                        checked={boardIsPrivate}
                        onChange={(e) => setBoardIsPrivate(e.target.checked)}
                        className="w-4 h-4 accent-red-600"
                    />
                    <FiLock className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">برد خصوصی</span>
                </label>

                <div className="flex gap-2.5">
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                    >
                        انصراف
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !boardName.trim()}
                        className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {saving ? 'در حال ذخیره...' : 'ذخیره'}
                    </button>
                </div>
            </div>
        </div>
    )
}