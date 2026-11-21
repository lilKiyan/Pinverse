"use client"

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import PinCard from '../components/PinCard'
import BoardCard from '../components/BoardCard'
import PinGridSkeleton from '../components/skeletons/PinGridSkeleton'
import BoardGridSkeleton from '../components/skeletons/BoardGridSkeleton'
import {
    FiPlus,
    FiGrid,
    FiBookmark,
    FiFolder,
    FiImage,
    FiLogIn,
    FiSearch,
    FiX,
    FiCompass,
} from 'react-icons/fi'
import type { PinDTO } from '../types/pin'
import type { Board as BoardDTO } from '../types/board'
import { useAuthStore } from '@/lib/authStore'

const CreateEditBoardModal = dynamic(() => import('../components/CreateEditBoardModal'), { ssr: false })
const DeleteBoardModal = dynamic(() => import('../components/DeleteBoardModal'), { ssr: false })

type Tab = 'my-pins' | 'saved-pins' | 'boards'

export default function MyBoardsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('my-pins')
    const [search, setSearch] = useState('')
    const [isBoardModalOpen, setIsBoardModalOpen] = useState(false)
    const [editingBoard, setEditingBoard] = useState<BoardDTO | null>(null)
    const [boardToDelete, setBoardToDelete] = useState<BoardDTO | null>(null)

    const queryClient = useQueryClient()
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

    const currentUser = user || meData

    const { data: myPins = [], isLoading: loadingMyPins } = useQuery<PinDTO[]>({
        queryKey: ['my-pins'],
        queryFn: async () => {
            const res = await fetch('/api/pins/mine')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های من')
            return res.json()
        },
        enabled: !!currentUser,
        staleTime: 60 * 1000,
    })

    const { data: savedPins = [], isLoading: loadingSavedPins } = useQuery<PinDTO[]>({
        queryKey: ['saved-pins'],
        queryFn: async () => {
            const res = await fetch('/api/saves')
            if (!res.ok) throw new Error('خطا در دریافت پین‌های ذخیره‌شده')
            return res.json()
        },
        enabled: !!currentUser,
        staleTime: 60 * 1000,
    })

    const { data: boards = [], isLoading: loadingBoards } = useQuery<BoardDTO[]>({
        queryKey: ['boards'],
        queryFn: async () => {
            const res = await fetch('/api/boards')
            if (!res.ok) throw new Error('خطا در دریافت بردها')
            return res.json()
        },
        enabled: !!currentUser,
        staleTime: 60 * 1000,
    })

    const openCreateBoardModal = () => {
        setEditingBoard(null)
        setIsBoardModalOpen(true)
    }

    const openEditBoardModal = (board: BoardDTO) => {
        setEditingBoard(board)
        setIsBoardModalOpen(true)
    }

    const closeBoardModal = () => {
        setIsBoardModalOpen(false)
        setEditingBoard(null)
    }

    const handleBoardSaved = () => {
        queryClient.invalidateQueries({ queryKey: ['boards'] })
    }

    const handleBoardDeleted = (boardId: string) => {
        queryClient.setQueryData<BoardDTO[]>(['boards'], (old) =>
            old ? old.filter((b) => b.id !== boardId) : old
        )
        queryClient.invalidateQueries({ queryKey: ['boards'] })
    }

    const handlePinDeleted = (pinId: string) => {
        queryClient.setQueryData<PinDTO[]>(['my-pins'], (old) =>
            old ? old.filter((p) => p.id !== pinId) : old
        )
        queryClient.setQueryData<PinDTO[]>(['saved-pins'], (old) =>
            old ? old.filter((p) => p.id !== pinId) : old
        )
        queryClient.invalidateQueries({ queryKey: ['my-pins'] })
        queryClient.invalidateQueries({ queryKey: ['saved-pins'] })
    }

    const handleTabChange = (nextTab: Tab) => {
        if (nextTab === activeTab) return
        setActiveTab(nextTab)
        setSearch('')
    }

    const filteredMyPins = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return myPins
        return myPins.filter((p) => {
            const title = (p.title || '').toLowerCase()
            const desc = (p.description || '').toLowerCase()
            return title.includes(q) || desc.includes(q)
        })
    }, [myPins, search])

    const filteredSavedPins = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return savedPins
        return savedPins.filter((p) => {
            const title = (p.title || '').toLowerCase()
            const desc = (p.description || '').toLowerCase()
            return title.includes(q) || desc.includes(q)
        })
    }, [savedPins, search])

    const filteredBoards = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return boards
        return boards.filter((b) => {
            const name = ((b as { name?: string; title?: string }).name || (b as { title?: string }).title || '').toLowerCase()
            const desc = ((b as { description?: string | null }).description || '').toLowerCase()
            return name.includes(q) || desc.includes(q)
        })
    }, [boards, search])

    const tabMeta: Record<Tab, { title: string; subtitle: string; searchPlaceholder: string }> = {
        'my-pins': {
            title: 'پین‌های من',
            subtitle: 'تصاویر و ایده‌هایی که منتشر کرده‌اید',
            searchPlaceholder: 'جستجو در پین‌های من...',
        },
        'saved-pins': {
            title: 'ذخیره‌شده‌ها',
            subtitle: 'مجموعه پین‌هایی که برای بعد نشانه‌گذاری کرده‌اید',
            searchPlaceholder: 'جستجو در ذخیره‌شده‌ها...',
        },
        'boards': {
            title: 'بردهای من',
            subtitle: 'پین‌های خود را در کالکشن‌های موضوعی مرتب کنید',
            searchPlaceholder: 'جستجو در بردها...',
        },
    }

    const tabs: { id: Tab; label: string; shortLabel: string; icon: typeof FiGrid; count: number }[] = [
        { id: 'my-pins', label: 'پین‌های من', shortLabel: 'پین‌ها', icon: FiGrid, count: myPins.length },
        { id: 'saved-pins', label: 'ذخیره‌شده‌ها', shortLabel: 'ذخیره‌ها', icon: FiBookmark, count: savedPins.length },
        { id: 'boards', label: 'بردهای من', shortLabel: 'بردها', icon: FiFolder, count: boards.length },
    ]

    if (checkingAuth && !currentUser) {
        return (
            <main dir="rtl" className="min-h-[80vh] flex items-center justify-center bg-[#FAFAFB]">
                <span className="h-7 w-7 border-[3px] border-gray-200 border-t-red-600 rounded-full animate-spin" />
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
                <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl p-7 text-center shadow-xl shadow-gray-200/60 ring-1 ring-gray-200/70 space-y-5 animate-[fadeInUp_0.3s_ease-out]">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/25">
                        <FiFolder className="h-6 w-6" />
                    </div>
                    <div className="space-y-1.5">
                        <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                            کتابخانه و بردهای شما
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                            برای مشاهده و مدیریت پین‌ها، ذخیره‌ها و بردهای شخصی خود وارد شوید.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                        <Link
                            href="/login"
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 py-3 px-5 text-xs sm:text-sm font-bold text-white shadow-md shadow-red-500/20 hover:brightness-105 active:scale-[0.98] transition-all no-underline"
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

    const renderEmptySearch = () => (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white py-16 px-4 text-center ring-1 ring-gray-200/70">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <FiSearch className="h-5 w-5" />
            </div>
            <p className="text-sm font-bold text-gray-800">
                نتیجه‌ای برای «{search.trim()}» پیدا نشد
            </p>
            <button
                type="button"
                onClick={() => setSearch('')}
                className="mt-4 rounded-xl bg-gray-100 hover:bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 transition-colors cursor-pointer"
            >
                پاک کردن جستجو
            </button>
        </div>
    )

    const renderPinsTab = (
        allPins: PinDTO[],
        visiblePins: PinDTO[],
        loading: boolean,
        type: 'mine' | 'saved'
    ) => {
        if (loading) {
            return <PinGridSkeleton count={10} />
        }

        if (allPins.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/70 py-16 sm:py-24 px-4 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 ring-1 ring-gray-200/70">
                        {type === 'mine' ? (
                            <FiImage className="h-6 w-6" />
                        ) : (
                            <FiBookmark className="h-6 w-6" />
                        )}
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                        {type === 'mine'
                            ? 'هنوز پینی منتشر نکرده‌اید'
                            : 'هنوز پینی ذخیره نکرده‌اید'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 max-w-xs leading-relaxed">
                        {type === 'mine'
                            ? 'اولین تصویر یا ایده خود را به اشتراک بگذارید تا اینجا نمایش داده شود.'
                            : 'در صفحه اصلی بگردید و پین‌های مورد علاقه‌تان را ذخیره کنید.'}
                    </p>
                    <Link
                        href={type === 'mine' ? '/create' : '/'}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-red-600 px-5 py-2.5
                            text-xs font-bold text-white transition-colors active:scale-95 no-underline"
                    >
                        {type === 'mine' ? (
                            <>
                                <FiPlus className="h-3.5 w-3.5" />
                                ساخت اولین پین
                            </>
                        ) : (
                            <>
                                <FiCompass className="h-3.5 w-3.5" />
                                کاوش پین‌ها
                            </>
                        )}
                    </Link>
                </div>
            )
        }

        if (visiblePins.length === 0) {
            return renderEmptySearch()
        }

        return (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 sm:gap-4 space-y-3 sm:space-y-4">
                {visiblePins.map((pin) => (
                    <PinCard
                        key={pin.id}
                        pin={pin}
                        optionsRotationDefault={-100}
                        onDeletePin={handlePinDeleted}
                        onRemoveFromBoard={handlePinDeleted}
                    />
                ))}
            </div>
        )
    }

    const renderBoardsTab = () => {
        if (loadingBoards) {
            return <BoardGridSkeleton count={8} />
        }

        if (boards.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-white/70 py-16 sm:py-24 px-4 text-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 ring-1 ring-gray-200/70">
                        <FiFolder className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-800">
                        هنوز بردی نساخته‌اید
                    </p>
                    <p className="mt-1 text-xs text-gray-400 max-w-xs leading-relaxed">
                        با ساخت برد، ایده‌ها و پین‌های مرتبط را در دسته‌بندی‌های منظم نگه‌داری کنید.
                    </p>
                    <button
                        type="button"
                        onClick={openCreateBoardModal}
                        className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5
                            text-xs font-bold text-white shadow-sm shadow-red-500/20
                            hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                    >
                        <FiPlus className="h-3.5 w-3.5" />
                        ساخت اولین برد
                    </button>
                </div>
            )
        }

        if (filteredBoards.length === 0) {
            return renderEmptySearch()
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {filteredBoards.map((board) => (
                    <BoardCard
                        key={board.id}
                        board={board}
                        onEdit={() => openEditBoardModal(board)}
                        onDelete={() => setBoardToDelete(board)}
                    />
                ))}
            </div>
        )
    }

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
                className="pointer-events-none absolute top-44 -left-24 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl"
            />

            <div className="relative mx-auto max-w-[1400px]">
<header className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-[fadeInUp_0.3s_ease-out_both]">
    <div>
        <h1
            key={activeTab}
            className="text-base sm:text-lg font-bold text-gray-900 tracking-tight animate-[fadeInUp_0.25s_ease-out]"
        >
            {tabMeta[activeTab].title}
        </h1>
        <p className="mt-0.5 text-[11px] sm:text-xs text-gray-400">
            {tabMeta[activeTab].subtitle}
        </p>
    </div>

    <div className="flex items-center gap-2 self-start sm:self-auto">
        {activeTab === 'boards' ? (
            <button
                type="button"
                onClick={openCreateBoardModal}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600
                    px-3.5 py-2 text-[11px] sm:text-xs font-bold text-white shadow-sm shadow-red-500/20
                    hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            >
                <FiPlus className="h-3.5 w-3.5" />
                ساخت برد جدید
            </button>
        ) : (
            <>
                <button
                    type="button"
                    onClick={openCreateBoardModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-gray-50
                        px-3 py-2 text-[11px] sm:text-xs font-bold text-gray-700 ring-1 ring-gray-200/90 shadow-xs
                        active:scale-95 transition-all cursor-pointer"
                >
                    <FiFolder className="h-3.5 w-3.5 text-gray-500" />
                    برد جدید
                </button>
                <Link
                    href="/create"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-red-600
                        px-3.5 py-2 text-[11px] sm:text-xs font-bold text-white shadow-xs
                        active:scale-95 transition-all no-underline"
                >
                    <FiPlus className="h-3.5 w-3.5" />
                    پین جدید
                </Link>
            </>
        )}
    </div>
</header>

                <div className="mb-6 rounded-2xl bg-white/90 backdrop-blur-md p-2.5 sm:p-3 ring-1 ring-gray-200/80 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 animate-[fadeInUp_0.35s_ease-out_50ms_backwards]">
                    <div className="grid grid-cols-3 lg:inline-flex items-center gap-1 rounded-xl bg-gray-100/90 p-1">
                        {tabs.map((item) => {
                            const Icon = item.icon
                            const isActive = activeTab === item.id

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleTabChange(item.id)}
                                    className={`flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2.5 sm:px-4 py-2
                                        text-xs font-bold transition-all cursor-pointer ${
                                            isActive
                                                ? 'bg-white text-gray-900 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                >
                                    <Icon
                                        className={`h-3.5 w-3.5 shrink-0 ${
                                            isActive ? 'text-red-600' : 'text-gray-400'
                                        }`}
                                    />
                                    <span className="hidden sm:inline">{item.label}</span>
                                    <span className="sm:hidden">{item.shortLabel}</span>
                                    <span
                                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                                            isActive
                                                ? 'bg-red-50 text-red-600'
                                                : 'bg-gray-200/70 text-gray-500'
                                        }`}
                                    >
                                        {item.count.toLocaleString('fa-IR')}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="relative w-full lg:w-72 xl:w-80 group">
                        <FiSearch className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-gray-900" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={tabMeta[activeTab].searchPlaceholder}
                            className="w-full rounded-xl placeholder:text-xs bg-gray-50/90 pr-10 pl-9 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400
                                ring-1 ring-gray-200/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/15 transition-all"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="پاک کردن جستجو"
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200/80 text-gray-500 hover:bg-gray-300 hover:text-gray-800 transition-colors cursor-pointer"
                            >
                                <FiX className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                <div key={activeTab} className="animate-[fadeInUp_0.3s_ease-out]">
                    {activeTab === 'my-pins' &&
                        renderPinsTab(myPins, filteredMyPins, loadingMyPins, 'mine')}
                    {activeTab === 'saved-pins' &&
                        renderPinsTab(savedPins, filteredSavedPins, loadingSavedPins, 'saved')}
                    {activeTab === 'boards' && renderBoardsTab()}
                </div>

                {isBoardModalOpen && (
                    <CreateEditBoardModal
                        editingBoard={editingBoard}
                        onClose={closeBoardModal}
                        onSave={handleBoardSaved}
                    />
                )}

                {boardToDelete && (
                    <DeleteBoardModal
                        board={boardToDelete}
                        onClose={() => setBoardToDelete(null)}
                        onDeleted={handleBoardDeleted}
                    />
                )}
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