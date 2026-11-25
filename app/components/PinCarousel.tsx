"use client"

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { FiChevronLeft, FiChevronRight, FiLayers } from 'react-icons/fi'
import type { PinImageDTO } from '@/app/types/pin'

type PinCarouselProps = {
    images: PinImageDTO[]
    title: string
    variant?: 'detail' | 'compact'
    showThumbnails?: boolean
    priority?: boolean
    onActiveChange?: (index: number, image: PinImageDTO) => void
}

export default function PinCarousel({
    images,
    title,
    variant = 'detail',
    showThumbnails = true,
    priority = true,
    onActiveChange,
}: PinCarouselProps) {
    const trackRef = useRef<HTMLDivElement | null>(null)
    const [activeIndex, setActiveIndex] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const scrollFrameRef = useRef<number | null>(null)

    const dragStateRef = useRef({
        active: false,
        startX: 0,
        startScrollLeft: 0,
        startTime: 0,
        hasDragged: false,
    })

    const safeImages = images.length > 0 ? images : []
    const total = safeImages.length
    const isMulti = total > 1

    useEffect(() => {
        setActiveIndex(0)
        if (trackRef.current) {
            trackRef.current.scrollTo({ left: 0, behavior: 'auto' })
        }
    }, [safeImages.length, safeImages[0]?.imageUrl])

    useEffect(() => {
        if (safeImages[activeIndex] && onActiveChange) {
            onActiveChange(activeIndex, safeImages[activeIndex])
        }
    }, [activeIndex, safeImages, onActiveChange])

    useEffect(() => {
        return () => {
            if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current)
        }
    }, [])

    const scrollToIndex = useCallback(
        (targetIndex: number) => {
            const el = trackRef.current
            if (!el || total === 0) return
            const clamped = Math.max(0, Math.min(total - 1, targetIndex))
            setActiveIndex(clamped)
            el.scrollTo({
                left: clamped * el.clientWidth,
                behavior: 'smooth',
            })
        },
        [total]
    )

    const handleScroll = useCallback(() => {
        if (dragStateRef.current.active) return
        const el = trackRef.current
        if (!el || el.clientWidth === 0) return

        if (scrollFrameRef.current) {
            cancelAnimationFrame(scrollFrameRef.current)
        }

        scrollFrameRef.current = requestAnimationFrame(() => {
            const idx = Math.round(el.scrollLeft / el.clientWidth)
            const clamped = Math.max(0, Math.min(total - 1, idx))
            setActiveIndex((prev) => (prev !== clamped ? clamped : prev))
        })
    }, [total])

    useEffect(() => {
        if (!isMulti) return

        const handleWindowMouseMove = (e: MouseEvent) => {
            if (!dragStateRef.current.active) return
            const el = trackRef.current
            if (!el) return

            const deltaX = e.clientX - dragStateRef.current.startX
            if (Math.abs(deltaX) > 4) {
                dragStateRef.current.hasDragged = true
            }
            el.scrollLeft = dragStateRef.current.startScrollLeft - deltaX
        }

        const handleWindowMouseUp = (e: MouseEvent) => {
            if (!dragStateRef.current.active) return
            dragStateRef.current.active = false
            setIsDragging(false)

            const el = trackRef.current
            if (!el || el.clientWidth === 0) return

            const deltaX = e.clientX - dragStateRef.current.startX
            const elapsed = Date.now() - dragStateRef.current.startTime
            const width = el.clientWidth
            const startSlide = Math.round(dragStateRef.current.startScrollLeft / width)

            let targetIndex = Math.round(el.scrollLeft / width)

            const isQuickFlick = Math.abs(deltaX) > 32 && elapsed < 320
            const isPastThreshold = Math.abs(deltaX) > width * 0.18

            if (isQuickFlick || isPastThreshold) {
                targetIndex = deltaX < 0 ? startSlide + 1 : startSlide - 1
            }

            const clamped = Math.max(0, Math.min(total - 1, targetIndex))
            setActiveIndex(clamped)

            requestAnimationFrame(() => {
                el.scrollTo({
                    left: clamped * width,
                    behavior: 'smooth',
                })
            })

            setTimeout(() => {
                dragStateRef.current.hasDragged = false
            }, 80)
        }

        window.addEventListener('mousemove', handleWindowMouseMove)
        window.addEventListener('mouseup', handleWindowMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleWindowMouseMove)
            window.removeEventListener('mouseup', handleWindowMouseUp)
        }
    }, [isMulti, total])

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isMulti || e.button !== 0) return
        const el = trackRef.current
        if (!el) return

        dragStateRef.current = {
            active: true,
            startX: e.clientX,
            startScrollLeft: el.scrollLeft,
            startTime: Date.now(),
            hasDragged: false,
        }
        setIsDragging(true)
    }

    const handleTouchStart = () => {
        dragStateRef.current.active = false
        setIsDragging(false)
    }

    const handleClickCapture = (e: React.MouseEvent) => {
        if (dragStateRef.current.hasDragged) {
            e.preventDefault()
            e.stopPropagation()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isMulti) return
        if (e.key === 'ArrowRight') {
            e.preventDefault()
            scrollToIndex(activeIndex + 1)
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault()
            scrollToIndex(activeIndex - 1)
        }
    }

    if (total === 0) return null

    if (!isMulti) {
        const single = safeImages[0]
        if (variant === 'compact') {
            return (
                <Image
                    src={single.imageUrl}
                    alt={title}
                    fill
                    draggable={false}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            )
        }

        return (
            <div className="relative w-full overflow-hidden rounded-2xl bg-gray-100 ring-1 ring-black/5">
                <Image
                    src={single.imageUrl}
                    alt={title}
                    width={single.width || 800}
                    height={single.height || 1000}
                    sizes="(max-width:1021px) 100vw, 50vw"
                    priority={priority}
                    style={{ width: '100%', height: 'auto' }}
                    className="w-full max-h-[75vh] object-cover rounded-xl transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pb-3 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white font-bold text-sm truncate">{title}</p>
                </div>
            </div>
        )
    }

    const isCompact = variant === 'compact'

    return (
        <div
            className="w-full select-none outline-none"
            tabIndex={isCompact ? undefined : 0}
            onKeyDown={isCompact ? undefined : handleKeyDown}
        >
            <div
                className={`relative w-full overflow-hidden ${
                    isCompact
                        ? 'h-full w-full'
                        : 'rounded-2xl bg-[#f5f5f7] ring-1 ring-black/5 shadow-inner'
                }`}
            >
                <div
                    ref={trackRef}
                    dir="ltr"
                    onScroll={handleScroll}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    onClickCapture={handleClickCapture}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ touchAction: 'pan-x pan-y' }}
                    className={`flex w-full overflow-x-auto scrollbar-none ${
                        isDragging
                            ? 'snap-none scroll-auto cursor-grabbing'
                            : 'snap-x snap-mandatory scroll-smooth cursor-grab'
                    } ${isCompact ? 'h-full' : 'h-[min(62vh,520px)] sm:h-[min(70vh,640px)]'}`}
                >
                    {safeImages.map((img, idx) => (
                        <div
                            key={img.id || `${img.imageUrl}-${idx}`}
                            className="relative w-full h-full shrink-0 snap-center snap-always flex items-center justify-center overflow-hidden"
                        >
                            {isCompact ? (
                                <Image
                                    src={img.imageUrl}
                                    alt={`${title} - تصویر ${idx + 1}`}
                                    fill
                                    draggable={false}
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    className="object-cover pointer-events-none"
                                    priority={idx === 0 && priority}
                                />
                            ) : (
                                <>
                                    <Image
                                        src={img.imageUrl}
                                        alt=""
                                        fill
                                        aria-hidden="true"
                                        draggable={false}
                                        sizes="50vw"
                                        className="object-cover scale-110 blur-2xl opacity-25 pointer-events-none"
                                    />
                                    <div className="relative z-10 w-full h-full flex items-center justify-center p-1 sm:p-2 pointer-events-none">
                                        <Image
                                            src={img.imageUrl}
                                            alt={`${title} - تصویر ${idx + 1}`}
                                            fill
                                            draggable={false}
                                            sizes="(max-width: 1021px) 100vw, 50vw"
                                            className="object-contain drop-shadow-sm pointer-events-none"
                                            priority={idx === 0 && priority}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>

                <div
                    className={`pointer-events-none absolute z-20 inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-md text-white font-bold ring-1 ring-white/20 shadow-md ${
                        isCompact
                            ? 'bottom-2.5 left-2.5 px-2 py-0.5 text-[10px]'
                            : 'top-3 left-3 px-3 py-1 text-xs'
                    }`}
                >
                    <FiLayers className={isCompact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
                    <span className="tabular-nums">
                        {(activeIndex + 1).toLocaleString('fa-IR')} / {total.toLocaleString('fa-IR')}
                    </span>
                </div>

                {activeIndex > 0 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            scrollToIndex(activeIndex - 1)
                        }}
                        aria-label="تصویر قبلی"
                        className={`absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg ring-1 ring-black/10 backdrop-blur-md transition-all cursor-pointer active:scale-90 ${
                            isCompact
                                ? 'h-7 w-7 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                                : 'h-9 w-9 sm:h-10 sm:w-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}
                    >
                        <FiChevronLeft className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
                    </button>
                )}

                {activeIndex < total - 1 && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            scrollToIndex(activeIndex + 1)
                        }}
                        aria-label="تصویر بعدی"
                        className={`absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg ring-1 ring-black/10 backdrop-blur-md transition-all cursor-pointer active:scale-90 ${
                            isCompact
                                ? 'h-7 w-7 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                                : 'h-9 w-9 sm:h-10 sm:w-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100'
                        }`}
                    >
                        <FiChevronRight className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
                    </button>
                )}

                <div
                    dir="ltr"
                    className={`absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none ${
                        isCompact
                            ? 'pb-2 pt-4 bg-gradient-to-t from-black/45 to-transparent'
                            : 'pb-3.5 pt-8 bg-gradient-to-t from-black/40 via-black/10 to-transparent'
                    }`}
                >
                    {safeImages.map((img, idx) => {
                        const isActive = idx === activeIndex
                        return (
                            <button
                                key={img.id || idx}
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    scrollToIndex(idx)
                                }}
                                aria-label={`رفتن به تصویر ${idx + 1}`}
                                className={`pointer-events-auto rounded-full transition-all duration-300 cursor-pointer ${
                                    isActive
                                        ? isCompact
                                            ? 'w-4 h-1.5 bg-white shadow-sm'
                                            : 'w-6 h-1.5 bg-white shadow-md'
                                        : 'w-1.5 h-1.5 bg-white/55 hover:bg-white/85'
                                }`}
                            />
                        )
                    })}
                </div>
            </div>

            {!isCompact && showThumbnails && (
                <div
                    dir="ltr"
                    className="mt-3 flex items-center justify-center sm:justify-start gap-2 overflow-x-auto scrollbar-none py-2 px-2"
                >
                    {safeImages.map((img, idx) => {
                        const isActive = idx === activeIndex
                        return (
                            <button
                                key={img.id || `thumb-${idx}`}
                                type="button"
                                onClick={() => scrollToIndex(idx)}
                                aria-label={`انتخاب تصویر ${idx + 1}`}
                                className={`relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 overflow-hidden rounded-xl transition-all duration-200 cursor-pointer ${
                                    isActive
                                        ? 'ring-2 ring-red-600 ring-offset-2 scale-105 opacity-100 shadow-md'
                                        : 'opacity-60 hover:opacity-95 ring-1 ring-black/10'
                                }`}
                            >
                                <Image
                                    src={img.imageUrl}
                                    alt={`${title} کوچک ${idx + 1}`}
                                    fill
                                    draggable={false}
                                    sizes="56px"
                                    className="object-cover"
                                />
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
