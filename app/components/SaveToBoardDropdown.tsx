"use client"

import { useEffect, useRef, useState } from 'react'
import { FiSearch, FiPlus, FiChevronDown, FiCheck, FiBookmark } from 'react-icons/fi'
import Image from 'next/image'
import type { SavedBoardInfo } from '../types/pin'

export type Board = {
    id: string
    name: string
    thumbnail: string
    isTopChoice?: boolean
}

type SaveToBoardDropdownProps = {
    boards: Board[]
    savedBoards?: SavedBoardInfo[]
    onToggleSave: (board: Board) => void
    onCreateBoard: (initialName?: string) => void
    isLoadingBoards: boolean
    onOpenChange?: (isOpen: boolean) => void
}

const DROPDOWN_ANIMATION_MS = 220

const SaveToBoardDropdown = ({
    boards,
    savedBoards = [],
    onToggleSave,
    onCreateBoard,
    isLoadingBoards,
    onOpenChange,
}: SaveToBoardDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [isOpenVisible, setIsOpenVisible] = useState(false)
    const [query, setQuery] = useState('')
    const [align, setAlign] = useState<'left' | 'right'>('left')
    const [justToggledId, setJustToggledId] = useState<string | null>(null)

    const containerRef = useRef<HTMLDivElement>(null)
    const pillWrapperRef = useRef<HTMLDivElement>(null)

    const POPUP_WIDTH = 360
    const VIEWPORT_MARGIN = 16

    const openDropdown = () => {
        setIsOpen(true)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => setIsOpenVisible(true))
        })
        onOpenChange?.(true)
    }

    const closeDropdown = () => {
        setIsOpenVisible(false)
        setTimeout(() => {
            setIsOpen(false)
            onOpenChange?.(false)
        }, DROPDOWN_ANIMATION_MS)
    }

    const toggleDropdown = () => {
        if (isOpen) closeDropdown()
        else openDropdown()
    }

    useEffect(() => {
        if (!isOpen) return

        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node
            if (containerRef.current && !containerRef.current.contains(target)) {
                closeDropdown()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [isOpen])

    useEffect(() => {
        if (!isOpen) return

        const handleScroll = () => closeDropdown()

        window.addEventListener('scroll', handleScroll, true)
        return () => window.removeEventListener('scroll', handleScroll, true)
    }, [isOpen])

    useEffect(() => {
        if (!isOpen || !pillWrapperRef.current) return
        const rect = pillWrapperRef.current.getBoundingClientRect()
        const spaceOnRight = window.innerWidth - rect.left
        const spaceOnLeft = rect.right

        if (
            spaceOnRight < POPUP_WIDTH + VIEWPORT_MARGIN &&
            spaceOnLeft > POPUP_WIDTH + VIEWPORT_MARGIN
        ) {
            setAlign('right')
        } else {
            setAlign('left')
        }
    }, [isOpen])

    const filteredBoards = boards.filter((b) =>
        b.name.toLowerCase().includes(query.toLowerCase())
    )

    const handleToggle = (board: Board) => {
        const wasSaved = savedBoardIds.has(board.id)
        onToggleSave(board)

        if (!wasSaved) {
            setJustToggledId(board.id)
            setTimeout(() => setJustToggledId(null), 600)
        }
    }

    const handleCreateBoard = () => {
        const initialName = query.trim()
        setQuery('')
        closeDropdown()
        onCreateBoard(initialName)
    }

    const savedBoardIds = new Set(savedBoards.map((sb) => sb.boardId))

    const renderBoardRow = (board: Board) => {
        const isSaved = savedBoardIds.has(board.id)
        const isJustToggled = justToggledId === board.id

        return (
            <button
                key={board.id}
                onClick={() => handleToggle(board)}
                className={`group/board w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl transition-all duration-200 cursor-pointer text-right
                    ${isSaved
                        ? 'bg-gradient-to-l from-red-50 to-red-50/30 ring-1 ring-red-100'
                        : 'hover:bg-gray-50 active:scale-[0.98]'
                    }`}
            >
                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100
                    ring-1 ring-black/5 transition-all duration-300
                    group-hover/board:ring-red-200 group-hover/board:scale-[1.05]">
                    <Image
                        src={board.thumbnail}
                        alt={board.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                    />
                </div>

                <span className={`font-bold text-sm truncate flex-1 transition-colors
                    ${isSaved ? 'text-red-700' : 'text-gray-900 group-hover/board:text-gray-700'}`}>
                    {board.name}
                </span>

                <span
                    className={`relative w-6 h-6 shrink-0 rounded-full flex items-center justify-center transition-all duration-300
                        ${isSaved
                            ? 'bg-gradient-to-br from-red-500 to-rose-600 scale-100 shadow-md shadow-red-200/60'
                            : 'border-2 border-gray-200 scale-90 opacity-0 group-hover/board:opacity-100 group-hover/board:scale-100 group-hover/board:border-gray-300'
                        } ${isJustToggled ? 'animate-[checkPop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]' : ''}`}
                >
                    {isSaved && <FiCheck className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </span>
            </button>
        )
    }

    return (
        <div
            ref={containerRef}
            className="absolute top-3 left-3 right-3 hidden md:flex items-center justify-between gap-2"
        >
            <div className="relative" ref={pillWrapperRef}>
                <button
                    onClick={toggleDropdown}
                    className={`group flex items-center gap-1.5 h-[38px] pl-3 pr-2.5 rounded-xl backdrop-blur-md text-white text-sm font-semibold shadow-lg transition-all duration-200 cursor-pointer pointer-events-auto
                        ${isOpen
                            ? 'bg-black/75 shadow-black/30 scale-[1.03]'
                            : 'bg-black/55 hover:bg-black/70 shadow-black/20 hover:shadow-black/30'
                        }`}
                >
                    <FiBookmark className={`w-4 h-4 shrink-0 transition-all duration-300
                        ${isOpenVisible ? 'text-red-400 fill-red-400 scale-110' : 'text-white/80 group-hover:scale-110'}`} />
                    <span className="truncate text-xs max-w-[120px]">
                        {savedBoards.length === 0
                            ? 'ذخیره'
                            : savedBoards.length === 1
                                ? savedBoards[0].boardName
                                : `${savedBoards.length} برد`}
                    </span>
                    <FiChevronDown
                        className={`shrink-0 w-3.5 h-3.5 transition-transform duration-200 ${isOpenVisible ? 'rotate-180' : ''}`}
                    />
                </button>

                {isOpen && (
                    <div
                        className={`absolute top-[calc(100%+10px)] ${align === 'left' ? 'left-0' : 'right-0'
                            } w-[calc(100vw-2rem)] sm:w-[360px] max-h-[min(480px,calc(100vh-8rem))]
                            bg-white rounded-3xl shadow-2xl shadow-black/15 ring-1 ring-black/5
                            flex flex-col overflow-hidden z-50 pointer-events-auto
                            transition-all duration-200 ease-out origin-top ${isOpenVisible
                                ? 'opacity-100 scale-100 translate-y-0'
                                : 'opacity-0 scale-95 -translate-y-2'
                            }`}
                    >
                        <div className="relative px-4 pt-4 pb-3 shrink-0">
                            <div className="sm:hidden flex justify-center mb-2.5">
                                <div className="w-9 h-1 rounded-full bg-gray-200" />
                            </div>

                            <h3 className="text-center font-extrabold text-gray-900 text-base mb-3">
                                ذخیره در برد
                            </h3>

                            <div className="relative">
                                <FiSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                <input
                                    autoFocus
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="جستجوی برد..."
                                    className="w-full h-11 pr-10 pl-4 bg-gray-50 rounded-2xl ring-1 ring-gray-200/70
                                        focus:bg-white focus:ring-2 focus:ring-red-300/60 outline-none
                                        text-sm text-right text-gray-800 placeholder-gray-400
                                        transition-all duration-200"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-2.5 pb-2 scroll-smooth
                            [&::-webkit-scrollbar]:w-1.5
                            [&::-webkit-scrollbar-thumb]:bg-gray-200
                            [&::-webkit-scrollbar-thumb]:rounded-full
                            [&::-webkit-scrollbar-track]:bg-transparent">
                            {isLoadingBoards ? (
                                <div className="flex flex-col justify-center items-center gap-3 py-10">
                                    <div className="w-7 h-7 border-[3px] border-gray-100 border-t-red-500 rounded-full animate-spin" />
                                    <span className="text-xs text-gray-400 font-medium">در حال بارگذاری بردها...</span>
                                </div>
                            ) : filteredBoards.length > 0 ? (
                                <div className="space-y-1 py-1">
                                    {filteredBoards.map(renderBoardRow)}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 ring-1 ring-gray-100 flex items-center justify-center rotate-3">
                                        <FiBookmark className="w-6 h-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-500 font-bold">
                                        {query ? 'بردی با این نام پیدا نشد' : 'هنوز بردی نساختی'}
                                    </p>
                                    {!query && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            با دکمه پایین اولین بردت رو بساز
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleCreateBoard}
                            className="shrink-0 group flex items-center gap-3 px-4 py-3.5 border-t border-gray-100
                                bg-gray-50/50 hover:bg-gradient-to-l hover:from-red-50 hover:to-white
                                cursor-pointer transition-all text-right"
                        >
                            <span className="w-9 h-9 rounded-xl bg-white ring-1 ring-gray-200
                                group-hover:bg-red-600 group-hover:ring-red-600
                                flex items-center justify-center shrink-0
                                shadow-sm transition-all duration-300 group-hover:rotate-90 group-hover:scale-110">
                                <FiPlus className="text-gray-500 group-hover:text-white transition-colors w-4 h-4" />
                            </span>
                            <span className="font-bold text-sm text-gray-700 group-hover:text-red-700 transition-colors">
                                ساخت برد جدید
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SaveToBoardDropdown