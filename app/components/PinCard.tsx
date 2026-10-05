"use client"

import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { FiUpload, FiCheckCircle, FiFolder, FiEyeOff, FiRotateCcw, FiShare2 } from 'react-icons/fi'
import type { Board } from './SaveToBoardDropdown'
import type { OptionKey } from './PinOptionsMenu'
import type { PinDTO } from '../types/pin'
import type { Board as BoardDTO } from '../types/board'
import { getCategoryIcon } from '@/lib/categories'

const ReportPinModal = dynamic(() => import('./ReportPinModal'), { ssr: false })
const SharePinModal = dynamic(() => import('./SharePinModal'), { ssr: false })

const SaveToBoardDropdown = dynamic(() => import('./SaveToBoardDropdown'), {
    ssr: false,
    loading: () => (
        <div className="absolute top-3 left-3 right-3">
            <div className="w-32 h-9 bg-gray-200/60 backdrop-blur-sm rounded-xl animate-pulse" />
        </div>
    ),
})

const PinOptionsMenu = dynamic(() => import('./PinOptionsMenu'), {
    ssr: false,
    loading: () => (
        <button
            disabled
            aria-label="گزینه‌های پین"
            className="w-8 h-8 rounded-full bg-gray-100 animate-pulse"
        />
    )
})

const DeletePinModal = dynamic(() => import('./DeletePinModal'), { ssr: false })
const EditPinModal = dynamic(() => import('./EditPinModal'), { ssr: false })

type PinCardProps = {
    pin: PinDTO
    onDeletePin?: (pinId: string) => void
    onRemoveFromBoard?: (pinId: string) => void
    optionsRotationDefault?: number
    menuExcluded?: OptionKey[]
    priority?: boolean
}

type SaveMutationVariables = {
    pinId: string
    boardId: string
    action: 'save' | 'unsave'
    boardName?: string
}

type PinsPage = {
    pins: PinDTO[]
    hasMore: boolean
}
type PinsCache = InfiniteData<PinsPage>

const PinCard = ({
    pin,
    onDeletePin,
    onRemoveFromBoard,
    optionsRotationDefault = -90,
    menuExcluded,
    priority = false,
}: PinCardProps) => {
    const queryClient = useQueryClient()

    const savedBoards = pin.savedBoards || []

    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [showDeletedToast, setShowDeletedToast] = useState(false)
    const [showReportToast, setShowReportToast] = useState(false)
    const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isUnreporting, setIsUnreporting] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const category = pin.category ?? null
    const CategoryIcon = category ? getCategoryIcon(category.icon) : null

    const { data: boardsRaw = [], isLoading: isLoadingBoards } = useQuery<BoardDTO[]>({
        queryKey: ['boards'],
        queryFn: async () => {
            const res = await fetch('/api/boards')
            if (!res.ok) throw new Error('خطا در دریافت بردها')
            return res.json()
        },
        staleTime: 60 * 1000,
    })

    const boards = boardsRaw.map((b) => ({
        id: b.id,
        name: b.name,
        thumbnail: b.pins?.[0]?.imageUrl || '/placeholder.jpg',
        isTopChoice: false,
    }))

    const createBoardMutation = useMutation({
        mutationFn: async (name: string): Promise<{ id: string; name: string }> => {
            const res = await fetch('/api/boards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            })
            if (!res.ok) throw new Error('خطا در ساخت برد')
            return res.json()
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['boards'] })
        },
    })

    const handleCreateBoard = (name: string) => {
        createBoardMutation.mutate(name)
    }

    const saveMutation = useMutation({
        mutationFn: async ({ pinId, boardId, action }: SaveMutationVariables): Promise<unknown> => {
            const res = await fetch('/api/saves', {
                method: action === 'save' ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinId, boardId }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در عملیات')
            }
            return res.json()
        },
        onSuccess: (_, variables) => {
            queryClient.setQueryData<PinsCache>(['pins'], (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        pins: page.pins.map((p) => {
                            if (p.id !== variables.pinId) return p

                            if (variables.action === 'save') {
                                return {
                                    ...p,
                                    savedBoards: [
                                        ...(p.savedBoards || []),
                                        {
                                            boardId: variables.boardId,
                                            boardName: variables.boardName || '',
                                        },
                                    ],
                                }
                            } else {
                                return {
                                    ...p,
                                    savedBoards: (p.savedBoards || []).filter(
                                        (sb) => sb.boardId !== variables.boardId
                                    ),
                                }
                            }
                        }),
                    })),
                }
            })

            if (variables.action === 'unsave' && onRemoveFromBoard) {
                onRemoveFromBoard(variables.pinId)
            }

            queryClient.invalidateQueries({ queryKey: ['saved-pins'] })
        },
    })

    const handleDownload = async () => {
        const rawName = (pin.title || 'pin').trim() || 'pin'

        const ext = pin.imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
        const filename = `${rawName}.${ext}`

        try {
            const res = await fetch(pin.imageUrl)
            if (!res.ok) throw new Error('خطا در دریافت تصویر')

            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('خطا در دانلود:', error)
        }
    }

    const handleUnreport = async () => {
        setIsUnreporting(true)
        try {
            const res = await fetch(`/api/pins/${pin.id}/report`, { method: 'DELETE' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'خطا در بازگردانی')
            }

            queryClient.setQueriesData<PinDTO[]>(
                { queryKey: ['related-pins'] },
                (old) => old?.map((p) => (p.id === pin.id ? { ...p, isReportedByMe: false } : p))
            )

            queryClient.setQueriesData<{ pins: PinDTO[] }>(
                { queryKey: ['user'] },
                (old) => (old
                    ? { ...old, pins: old.pins.map((p) => (p.id === pin.id ? { ...p, isReportedByMe: false } : p)) }
                    : old)
            )

            await queryClient.invalidateQueries()
        } catch (err) {
            console.error(err)
        } finally {
            setIsUnreporting(false)
        }
    }

    const handleToggleSave = (board: Board) => {
        const isCurrentlySaved = savedBoards.some((sb) => sb.boardId === board.id)
        const action = isCurrentlySaved ? 'unsave' : 'save'

        saveMutation.mutate({
            pinId: pin.id,
            boardId: board.id,
            action,
            boardName: board.name,
        })
    }

    const handleShare = async () => {
        const url = `${window.location.origin}/pin/${pin.id}`
        const title = pin.title

        if (navigator.share) {
            try {
                await navigator.share({ title, url })
                return
            } catch {
                return
            }
        }

        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(url)
            } else {
                const textarea = document.createElement('textarea')
                textarea.value = url
                textarea.style.position = 'fixed'
                textarea.style.opacity = '0'
                document.body.appendChild(textarea)
                textarea.focus()
                textarea.select()
                document.execCommand('copy')
                document.body.removeChild(textarea)
            }
            console.log('لینک کپی شد ✅')
        } catch (error) {
            console.error('خطا در کپی لینک:', error)
        }
    }

    if (pin.isReportedByMe) {
        return (
            <div className="group relative break-inside-avoid mb-4">
                <div
                    className="relative overflow-hidden rounded-[15px] ring-1 ring-black/5 bg-gradient-to-br from-gray-50 to-red-50/40 flex flex-col items-center justify-center gap-2.5 p-4 text-center transition-all duration-300 group-hover:ring-red-200"
                    style={{ aspectRatio: `${pin.imageWidth || 500} / ${pin.imageHeight || 750}` }}
                >
                    <div className="w-9 h-9 rounded-full bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center">
                        <FiEyeOff className="w-4 h-4 text-gray-400" />
                    </div>

                    <p className="text-[11px] font-bold text-gray-500 leading-none">
                        این پین برای شما پنهان شده
                    </p>

                    <button
                        onClick={handleUnreport}
                        disabled={isUnreporting}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white text-gray-500 hover:text-red-600 text-[10px] font-semibold ring-1 ring-black/5 shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isUnreporting ? (
                            <span className="w-3 h-3 border-2 border-gray-200 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                            <FiRotateCcw className="w-3 h-3" />
                        )}
                        بازگردانی
                    </button>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="group relative break-inside-avoid mb-4">
                <Link href={`/pin/${pin.id}`} className="block no-underline">
                    <div
                        className="relative overflow-hidden rounded-[15px] bg-gray-100 ring-1 ring-black/5 group-hover:ring-black/10 transition-all"
                        style={{ aspectRatio: `${pin.imageWidth || 500} / ${pin.imageHeight || 750}` }}
                    >
                        <Image
                            src={pin.imageUrl}
                            alt={pin.title}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                            className="object-cover group-hover:brightness-75 transition-all duration-300"
                            priority={priority}
                        />

                        {/* 🏷️ badge دسته — از داده‌ی API */}
                        {category && CategoryIcon && (
                            <span
                                className="absolute top-2 right-2 z-10
                                    inline-flex items-center gap-1
                                    bg-black/45 backdrop-blur-md
                                    text-white text-[10px] font-bold
                                    px-2 py-0.5 rounded-full
                                    ring-1 ring-white/20
                                    transition-all duration-200
                                    group-hover:opacity-0"
                            >
                                <CategoryIcon className="w-3 h-3" />
                                {category.name}
                            </span>
                        )}
                    </div>
                </Link>

                <div
                    className={`absolute inset-0 z-20 transition-opacity duration-200 pointer-events-none ${isSaveMenuOpen
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100'
                        }`}
                >
                    <SaveToBoardDropdown
                        boards={boards}
                        savedBoards={savedBoards}
                        onToggleSave={handleToggleSave}
                        onCreateBoard={handleCreateBoard}
                        isLoadingBoards={isLoadingBoards}
                        onOpenChange={setIsSaveMenuOpen}
                    />
                    <button
                        aria-label="اشتراک‌گذاری پین"
                        onClick={() => setIsShareModalOpen(true)}   // ✅ به‌جای navigator.share
                        className="pointer-events-auto absolute bottom-12 right-3 w-10 h-10 bg-white/90 rounded-2xl cursor-pointer flex items-center justify-center text-lg shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
                    >
                        <FiUpload />
                    </button>
                </div>

                <div className="mt-1.5 px-1 flex items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-xs text-gray-500 truncate min-w-0">
                        <FiFolder className="w-3 h-3 shrink-0 text-gray-400" />
                        <span className="truncate text-[9px] md:text-xs">
                            {savedBoards.length === 0
                                ? 'بدون برد'
                                : savedBoards.length === 1
                                    ? savedBoards[0].boardName
                                    : `${savedBoards.length} برد`}
                        </span>
                    </p>
                    <PinOptionsMenu
                        onEdit={() => setIsEditModalOpen(true)}
                        onDelete={() => setIsDeleteModalOpen(true)}
                        onDownload={handleDownload}
                        onShare={handleShare}
                        onSend={() => setIsShareModalOpen(true)}
                        isOwner={pin.isOwner ?? false}
                        rotationDefault={optionsRotationDefault}
                        excludedOptions={menuExcluded}
                        onReport={() => setIsReportModalOpen(true)}
                    />
                </div>
            </div>

            {isEditModalOpen && (
                <EditPinModal
                    pinId={pin.id}
                    initialTitle={pin.title}
                    initialDescription={pin.description ?? undefined}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}

            {isDeleteModalOpen && (
                <DeletePinModal
                    pinId={pin.id}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onDeleteSuccess={(id) => {
                        setShowDeletedToast(true)
                        if (onDeletePin) onDeletePin(id)
                        setTimeout(() => setShowDeletedToast(false), 2000)
                    }}
                />
            )}

            {showDeletedToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-white shadow-2xl border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3 animate-[fadeInUp_0.3s_ease-out]">
                    <FiCheckCircle className="text-green-500 text-xl" />
                    <span className="text-gray-800 font-medium">پین با موفقیت حذف شد</span>
                </div>
            )}

            {isReportModalOpen && (
                <ReportPinModal
                    pinId={pin.id}
                    onClose={() => setIsReportModalOpen(false)}
                    onReported={() => {
                        queryClient.setQueryData<PinsCache>(['pins'], (old) => {
                            if (!old) return old
                            return {
                                ...old,
                                pages: old.pages.map((page) => ({
                                    ...page,
                                    pins: page.pins.filter((p) => p.id !== pin.id),
                                })),
                            }
                        })

                        queryClient.setQueriesData<PinDTO[]>(
                            { queryKey: ['related-pins'] },
                            (old) => old?.map((p) => (p.id === pin.id ? { ...p, isReportedByMe: true } : p))
                        )
                        queryClient.setQueriesData<{ pins: PinDTO[] }>(
                            { queryKey: ['user'] },
                            (old) => (old
                                ? { ...old, pins: old.pins.map((p) => (p.id === pin.id ? { ...p, isReportedByMe: true } : p)) }
                                : old)
                        )

                        queryClient.invalidateQueries({ queryKey: ['related-pins'] })
                        queryClient.invalidateQueries({ queryKey: ['user', pin.userId] })

                        setShowReportToast(true)
                        setTimeout(() => setShowReportToast(false), 2500)
                    }}
                />
            )}

            {showReportToast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] bg-white shadow-2xl border border-gray-100 rounded-2xl px-6 py-4 flex items-center gap-3 animate-[fadeInUp_0.3s_ease-out]">
                    <FiCheckCircle className="text-green-500 text-xl" />
                    <span className="text-gray-800 font-medium text-xs">گزارش شما ثبت شد — این پین دیگر برای شما نمایش داده نمی‌شود</span>
                </div>
            )}

            {isShareModalOpen && (
                <SharePinModal
                    pinId={pin.id}
                    pinTitle={pin.title}
                    pinImageUrl={pin.imageUrl}
                    onClose={() => setIsShareModalOpen(false)}
                />
            )}
        </>
    )
}

export default PinCard