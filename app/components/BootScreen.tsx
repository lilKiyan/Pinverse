"use client"

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { FiX, FiZap } from 'react-icons/fi'

type BootScreenProps = {
    /**
     * حداقل مدت زمان نمایش بوت پیج به میلی‌ثانیه (پیش‌فرض: ۱۶۰۰ میلی‌ثانیه)
     */
    minDurationMs?: number
    /**
     * آیا در صورت وجود سشن قبلی نیز با اجبار نمایش داده شود
     */
    forceShow?: boolean
}

export default function BootScreen({
    minDurationMs = 1700,
    forceShow = false,
}: BootScreenProps) {
    const [isVisible, setIsVisible] = useState(false)
    const [isExiting, setIsExiting] = useState(false)
    const [progress, setProgress] = useState(0)
    const [statusIndex, setStatusIndex] = useState(0)

    const statusMessages = [
        'در حال آماده‌سازی محیط...',
        'بارگذاری آخرین پین‌ها و ایده‌ها...',
        'همگام‌سازی دسته‌بندی‌ها و بردهای شما...',
        'خوش آمدید ✨',
    ]

    const startTimeRef = useRef<number>(Date.now())
    const rafRef = useRef<number | null>(null)

    useEffect(() => {
        // بررسی اینکه آیا قبلاً در این سشن بوت‌اسکرین دیده شده یا خیر
        if (typeof window === 'undefined') return

        const params = new URLSearchParams(window.location.search)
        const hasBootParam = params.has('boot') || params.has('splash')

        const alreadySeen = sessionStorage.getItem('pinverse_boot_seen')
        if (alreadySeen && !forceShow && !hasBootParam) {
            return
        }

        setIsVisible(true)
        startTimeRef.current = Date.now()

        // حلقه انیمیشن نوار پیشرفت نرم
        const updateProgress = () => {
            const elapsed = Date.now() - startTimeRef.current
            const rawRatio = Math.min(elapsed / minDurationMs, 1)

            // انیمیشن شتاب‌دار واقع‌گرایانه (Ease-Out Cubic)
            const easedRatio = 1 - Math.pow(1 - rawRatio, 2.6)
            const currentPct = Math.round(easedRatio * 100)
            setProgress(currentPct)

            // تغییر پیام وضعیت بر اساس درصد
            if (currentPct < 30) {
                setStatusIndex(0)
            } else if (currentPct < 65) {
                setStatusIndex(1)
            } else if (currentPct < 95) {
                setStatusIndex(2)
            } else {
                setStatusIndex(3)
            }

            if (rawRatio < 1) {
                rafRef.current = requestAnimationFrame(updateProgress)
            } else {
                // اتمام لودینگ -> شروع فید اوت نرم
                setTimeout(() => {
                    handleDismiss()
                }, 220)
            }
        }

        rafRef.current = requestAnimationFrame(updateProgress)

        // گوش دادن به کلید Esc برای رد شدن سریع
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleDismiss()
            }
        }
        window.addEventListener('keydown', handleKeyDown)

        // امکان بازپخش از کنسول یا رویداد با window.dispatchEvent(new CustomEvent('pinverse:replay-boot'))
        const handleReplay = () => {
            sessionStorage.removeItem('pinverse_boot_seen')
            setIsExiting(false)
            setIsVisible(true)
            setProgress(0)
            setStatusIndex(0)
            startTimeRef.current = Date.now()
            rafRef.current = requestAnimationFrame(updateProgress)
        }
        window.addEventListener('pinverse:replay-boot', handleReplay)

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('pinverse:replay-boot', handleReplay)
        }
    }, [minDurationMs, forceShow])

    const handleDismiss = () => {
        try {
            sessionStorage.setItem('pinverse_boot_seen', '1')
        } catch {
            // حالت Private Browsing در برخی مرورگرها
        }
        setIsExiting(true)
        setTimeout(() => {
            setIsVisible(false)
        }, 550)
    }

    if (!isVisible) return null

    return (
        <div
            dir="rtl"
            role="status"
            aria-live="polite"
            className={`fixed inset-0 z-[999999] flex flex-col items-center justify-center overflow-hidden bg-[#0A0B10] select-none transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isExiting
                    ? 'opacity-0 scale-105 pointer-events-none blur-xs'
                    : 'opacity-100 scale-100'
            }`}
        >
            {/* ── لایه‌های نوری و جلوه‌های پس‌زمینه (Ambient Gradients) ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* نور سرخ مرکزی */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-rose-600/20 via-red-600/15 to-transparent blur-3xl animate-pulse" />
                {/* هاله بنفش تیره در گوشه */}
                <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
                {/* هاله نارنجی در پایین */}
                <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
                {/* پترن نقطه‌ای ظریف در تاریکی */}
                <div
                    className="absolute inset-0 opacity-[0.035]"
                    style={{
                        backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            {/* ── دکمه رد شدن سریع (Skip Button) ── */}
            <div className="absolute top-5 left-5 z-20">
                <button
                    type="button"
                    onClick={handleDismiss}
                    className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 px-3.5 py-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-all cursor-pointer shadow-lg backdrop-blur-md active:scale-95"
                >
                    <span>رد شدن</span>
                    <FiX className="h-3 w-3 transition-transform group-hover:rotate-90" />
                </button>
            </div>

            {/* ── کانتینر مرکزی لوگو و انیمیشن ── */}
            <div className="relative z-10 flex flex-col items-center px-6 max-w-sm w-full text-center">
                {/* المان آیکون با موج راداری و درخشش نئونی */}
                <div className="relative mb-8 flex items-center justify-center">
                    {/* حلقه موج اول */}
                    <div className="absolute w-28 h-28 rounded-full border border-red-500/25 animate-ping opacity-35" />
                    {/* حلقه موج دوم با تاخیر */}
                    <div className="absolute w-36 h-36 rounded-full border border-rose-500/15 animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]" />
                    {/* هاله درخشان پشت لوگو */}
                    <div className="absolute w-24 h-24 rounded-3xl bg-red-600/30 blur-xl" />

                    {/* باکس لوگو شیشه‌ای مدرن */}
                    <div className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-br from-red-500 via-red-600 to-rose-700 p-0.5 shadow-2xl shadow-red-900/50 flex items-center justify-center transform transition-transform hover:scale-105">
                        <div className="w-full h-full rounded-[22px] bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center relative overflow-hidden">
                            {/* افکت انعکاس نور متحرک روی لوگو */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-white/25 via-transparent to-transparent opacity-80" />

                            {/* کاراکتر اختصاصی حرف P اینورس */}
                            <span className="text-white text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-md select-none">
                                P
                            </span>
                        </div>
                    </div>
                </div>

                {/* تایپوگرافی نام برند PInverse */}
                <div className="space-y-2 mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold mb-1 shadow-xs">
                        <FiZap className="h-3 w-3 text-rose-400 animate-pulse" />
                        <span>نسخه وب اپلیکیشن</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-rose-100 to-rose-400 drop-shadow-sm">
                        PInverse
                    </h1>

                    <p className="text-xs sm:text-sm text-gray-400 font-medium leading-relaxed">
                        دنیای بی‌پایان ایده‌ها، هنر و الهام
                    </p>
                </div>

                {/* نوار پیشرفت لودینگ (Progress Bar) */}
                <div className="w-full max-w-[260px] space-y-2.5">
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08] backdrop-blur-sm border border-white/5">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-rose-600 via-red-500 to-amber-400 transition-all duration-150 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            {/* ذره نورانی سر نوار پیشرفت */}
                            <div className="absolute -top-0.5 left-0 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_#ff4d4d]" />
                        </div>
                    </div>

                    {/* متن وضعیت و درصد */}
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold px-0.5">
                        <span className="truncate max-w-[190px] text-gray-300 transition-all duration-200">
                            {statusMessages[statusIndex]}
                        </span>
                        <span className="tabular-nums font-mono text-rose-400">
                            {progress}%
                        </span>
                    </div>
                </div>
            </div>

            {/* ── فوتر یا امضای پایین صفحه ── */}
            <div className="absolute bottom-6 text-center text-[10px] text-gray-500 font-medium tracking-wider">
                <span>ساخته شده برای اشتراک‌گذاری زیبایی‌ها • </span>
                <span className="text-gray-400 font-bold">PInverse 2026</span>
            </div>
        </div>
    )
}
