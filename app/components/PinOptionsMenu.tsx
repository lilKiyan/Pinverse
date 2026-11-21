"use client"

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
    FiMoreHorizontal,
    FiDownload,
    FiShare2,
    FiFlag,
    FiEdit2,
    FiTrash2,
} from 'react-icons/fi'

const RADIUS = 70
const ROTATION_RIGHT_EDGE = -270
const EDGE_THRESHOLD = 220

const ANGLE_STEP = 35
const BASE_ANGLE = 20

const ALL_OPTIONS = [
    { key: 'download', icon: FiDownload, label: 'دانلود', ownerOnly: false },
    { key: 'flag', icon: FiFlag, label: 'گزارش', ownerOnly: false, notForOwner: true },
    { key: 'edit', icon: FiEdit2, label: 'ویرایش', ownerOnly: true },
    { key: 'delete', icon: FiTrash2, label: 'حذف', ownerOnly: true },
    { key: 'send', icon: FiShare2, label: 'ارسال', ownerOnly: false },
] as const

export type OptionKey = (typeof ALL_OPTIONS)[number]['key']

const STAGGER_MS = 55
const BUTTON_SIZE = 36

const getIconStyles = (label: string) => {
    if (label === 'حذف') {
        return 'text-red-600 hover:bg-gradient-to-br hover:from-red-100 hover:to-red-200 hover:shadow-[0_8px_25px_rgba(239,68,68,0.4)] hover:ring-2 hover:ring-red-300'
    }
    if (label === 'ویرایش') {
        return 'text-blue-600 hover:bg-gradient-to-br hover:from-blue-100 hover:to-blue-200 hover:shadow-[0_8px_25px_rgba(59,130,246,0.4)] hover:ring-2 hover:ring-blue-300'
    }
    if (label === 'اشتراک‌گذاری') {
        return 'text-indigo-600 hover:bg-gradient-to-br hover:from-indigo-100 hover:to-indigo-200 hover:shadow-[0_8px_25px_rgba(99,102,241,0.4)] hover:ring-2 hover:ring-indigo-300'
    }
    if (label === 'ارسال') {
        return 'text-emerald-600 hover:bg-gradient-to-br hover:from-emerald-100 hover:to-teal-200 hover:shadow-[0_8px_25px_rgba(16,185,129,0.4)] hover:ring-2 hover:ring-emerald-300'
    }
    return 'text-gray-700 hover:bg-gradient-to-br hover:from-gray-100 hover:to-gray-200 hover:shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:ring-2 hover:ring-gray-300'
}

type PinOptionsMenuProps = {
    onEdit?: () => void
    onDelete?: () => void
    onDownload?: () => void
    onShare?: () => void
    onReport?: () => void
    onSend?: () => void
    rotationDefault?: number
    isOwner?: boolean
    excludedOptions?: OptionKey[]
}

const PinOptionsMenu = ({
    onEdit,
    onDelete,
    onDownload,
    onShare,
    onReport,
    onSend,
    isOwner = false,
    rotationDefault = -90,
    excludedOptions,
}: PinOptionsMenuProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [visibleOpen, setVisibleOpen] = useState(false)
    const [anchor, setAnchor] = useState<{ top: number; left: number; rotation: number } | null>(null)
    const [mounted, setMounted] = useState(false)

    const triggerRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    const filteredOptions = ALL_OPTIONS
        .filter((option) => {
            if (option.ownerOnly && !isOwner) return false
            if ('notForOwner' in option && option.notForOwner && isOwner) return false
            if (excludedOptions && excludedOptions.includes(option.key)) return false
            return true
        })
        .map((option, index) => ({
            ...option,
            angle: BASE_ANGLE + index * ANGLE_STEP,
        }))

    useEffect(() => setMounted(true), [])

    const updateAnchor = () => {
        if (!triggerRef.current) return
        const rect = triggerRef.current.getBoundingClientRect()
        const spaceRight = window.innerWidth - rect.right
        const rotation = spaceRight < EDGE_THRESHOLD ? ROTATION_RIGHT_EDGE : rotationDefault

        setAnchor({
            top: rect.top + rect.height / 2,
            left: rect.left + rect.width / 2,
            rotation,
        })
    }

    const closeMenu = () => {
        setVisibleOpen(false)
        setTimeout(() => setIsOpen(false), 300)
    }

    const closeMenuInstantly = () => {
        setVisibleOpen(false)
        setIsOpen(false)
        setAnchor(null)
    }

    const handleToggle = () => {
        if (!isOpen) {
            updateAnchor()
            setIsOpen(true)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setVisibleOpen(true))
            })
        } else {
            closeMenu()
        }
    }

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node
            if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
            closeMenu()
        }
        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('touchstart', handleClickOutside, { passive: true })
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('touchstart', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        if (!isOpen) return
        window.addEventListener('scroll', closeMenu, true)
        window.addEventListener('resize', closeMenu)
        return () => {
            window.removeEventListener('scroll', closeMenu, true)
            window.removeEventListener('resize', closeMenu)
        }
    }, [isOpen])

    const getTransitionStyle = (index: number, isOpen: boolean, isVisible: boolean) => {
        const delay = isVisible ? index * STAGGER_MS : (filteredOptions.length - 1 - index) * STAGGER_MS
        const easing = isOpen ? 'cubic-bezier(0.34, 1.56, 0.64, 1)' : 'cubic-bezier(0.4, 0, 1, 1)'
        return `transform 300ms ${easing} ${delay}ms, opacity 300ms ${easing} ${delay}ms, background-color 200ms ease 0ms, box-shadow 200ms ease 0ms, ring 200ms ease 0ms`
    }

    const handleOptionClick = (key: OptionKey) => {
        if (key === 'flag' && onReport) {
            closeMenuInstantly()
            onReport()
            return
        }

        if (key === 'edit' && onEdit) {
            closeMenuInstantly()
            onEdit()
            return
        }

        if (key === 'delete' && onDelete) {
            closeMenuInstantly()
            onDelete()
            return
        }

        if (key === 'send' && onSend) {
            closeMenuInstantly()
            onSend()
            return
        }
        if (key === 'download' && onDownload) onDownload()

        closeMenu()
    }

    return (
        <>
            <button
                ref={triggerRef}
                onClick={handleToggle}
                aria-label="گزینه‌های پین"
                className="group/three-dot relative px-1.5 py-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 cursor-pointer"
            >
                <FiMoreHorizontal
                    className={`w-5 h-5 text-gray-800 transition-transform duration-300 ${isOpen ? 'rotate-90' : 'group-hover/three-dot:scale-110'}`}
                />
            </button>

            {mounted && anchor && createPortal(
                <div
                    ref={menuRef}
                    style={{ position: 'fixed', top: anchor.top, left: anchor.left }}
                    className="z-[9999] pointer-events-none"
                >
                    {filteredOptions.map((option, index) => {
                        const angleRad = ((option.angle + anchor.rotation) * Math.PI) / 180
                        const dx = Math.cos(angleRad) * RADIUS
                        const dy = -Math.sin(angleRad) * RADIUS
                        const Icon = option.icon
                        const half = BUTTON_SIZE / 2

                        return (
                            <button
                                key={option.key}
                                title={option.label}
                                onClick={() => handleOptionClick(option.key)}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: BUTTON_SIZE,
                                    height: BUTTON_SIZE,
                                    transform: visibleOpen
                                        ? `translate(${dx - half}px, ${dy - half}px) scale(1)`
                                        : `translate(${-half}px, ${-half}px) scale(0.35)`,
                                    opacity: visibleOpen ? 1 : 0,
                                    transition: getTransitionStyle(index, isOpen, visibleOpen),
                                    pointerEvents: isOpen ? 'auto' : 'none',
                                }}
                                className={`rounded-full bg-white shadow-[0_4px_14px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-95 cursor-pointer ${getIconStyles(option.label)}`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        )
                    })}
                </div>,
                document.body
            )}
        </>
    )
}

export default PinOptionsMenu