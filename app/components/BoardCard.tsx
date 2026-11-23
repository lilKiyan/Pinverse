"use client"

import Link from 'next/link'
import Image from 'next/image'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import type { Board, BoardPinPreview } from '../types/board'

type BoardCardProps = {
    board: Board
    onEdit?: () => void
    onDelete?: () => void
}

export default function BoardCard({
    board,
    onEdit,
    onDelete,
}: BoardCardProps) {
    const coverPins: BoardPinPreview[] = board.pins || []

    return (
        <div className="group relative px-1 md:px-0">
            <Link href={`/board/${board.id}`} className="block no-underline">
                <div
                    className={`relative rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-sm transition-all duration-300 group-hover:shadow-xl group-hover:ring-black/10 ${
                        coverPins.length === 0
                            ? 'aspect-square flex items-center justify-center'
                            : ''
                    }`}
                >
                    {coverPins.length > 0 ? (
                        <div className="grid grid-cols-2 gap-0.5 aspect-square">
                            {coverPins.map((pin) => (
                                <div
                                    key={pin.id}
                                    className={`relative overflow-hidden ${
                                        coverPins.length === 1 ? 'col-span-2 row-span-2' : ''
                                    }`}
                                >
                                    <Image
                                        src={pin.imageUrl}
                                        alt={pin.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, 25vw"
                                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center gap-2 w-full h-full bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-200">
                            <span className="text-4xl opacity-70">📌</span>
                            <span className="text-xs font-medium text-gray-400">برد خالی</span>
                        </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>

                <div className="mt-2.5 px-1">
                    <h3 className="font-bold text-gray-900 text-[15px] truncate group-hover:text-red-600 transition-colors duration-200">
                        {board.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {coverPins.length} پین
                    </p>
                </div>
            </Link>

            <div
                className="
                    absolute top-2.5 left-4 md:left-2.5 flex gap-2
                    transition-all duration-300 ease-out
                    opacity-100 translate-y-0
                    [@media(hover:hover)]:opacity-0
                    [@media(hover:hover)]:translate-y-1
                    [@media(hover:hover)]:pointer-events-none
                    [@media(hover:hover)]:group-hover:opacity-100
                    [@media(hover:hover)]:group-hover:translate-y-0
                    [@media(hover:hover)]:group-hover:pointer-events-auto
                "
            >
                <button
                    type="button"
                    onClick={onEdit}
                    aria-label="ویرایش برد"
                    className="
                        touch-manipulation cursor-pointer
                        h-9 w-9 sm:h-8 sm:w-8
                        flex items-center justify-center
                        rounded-full bg-white/95 backdrop-blur-sm
                        text-gray-700 shadow-md ring-1 ring-black/5
                        hover:bg-white hover:shadow-lg hover:scale-110
                        active:scale-95
                        transition-all duration-200
                    "
                >
                    <FiEdit2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>

                <button
                    type="button"
                    onClick={onDelete}
                    aria-label="حذف برد"
                    className="
                        touch-manipulation cursor-pointer
                        h-9 w-9 sm:h-8 sm:w-8
                        flex items-center justify-center
                        rounded-full bg-white/95 backdrop-blur-sm
                        text-gray-700 shadow-md ring-1 ring-black/5
                        hover:bg-red-50 hover:text-red-600 hover:shadow-lg hover:scale-110
                        active:scale-95
                        transition-all duration-200
                    "
                >
                    <FiTrash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
            </div>
        </div>
    )
}