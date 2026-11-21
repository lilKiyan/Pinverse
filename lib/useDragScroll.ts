"use client"

import { useEffect, useRef } from 'react'

/**
 * هوک فوق‌بهینه برای درگ کردن المان‌های اسکرولی با ماوس (Drag to Scroll)
 * ویژگی‌ها:
 * ۱. صفر ری‌رندر در ری‌اکت (استفاده کامل از Ref و رویدادهای بومی DOM)
 * ۲. اجرای ۶۰ تا ۱۲۰ فریم بر ثانیه با شتاب مستقیم
 * ۳. جلوگیری هوشمند از کلیک ناخواسته روی دکمه‌ها پس از درگ
 * ۴. پشتیبانی از غلتک ماوس (Wheel) برای اسکرول افقی
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T | null>(null)
    const isDownRef = useRef(false)
    const startXRef = useRef(0)
    const prevXRef = useRef(0)
    const hasDraggedRef = useRef(false)
    const velocityRef = useRef(0)
    const animIdRef = useRef<number | null>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        // ── ۱. شروع درگ ──
        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return // فقط کلیک چپ
            isDownRef.current = true
            hasDraggedRef.current = false
            startXRef.current = e.clientX
            prevXRef.current = e.clientX
            velocityRef.current = 0

            if (animIdRef.current) {
                cancelAnimationFrame(animIdRef.current)
                animIdRef.current = null
            }

            el.classList.add('cursor-grabbing', 'select-none')
        }

        // ── ۲. حرکت ماوس (روی سطح کل پنجره برای اینکه موس بیرون رفت قطع نشه) ──
        const onMouseMove = (e: MouseEvent) => {
            if (!isDownRef.current) return

            const deltaX = e.clientX - prevXRef.current
            prevXRef.current = e.clientX
            velocityRef.current = deltaX

            if (Math.abs(e.clientX - startXRef.current) > 5) {
                hasDraggedRef.current = true
            }

            // درگ نرم مستقیم بدون تاخیر
            el.scrollLeft -= deltaX
        }

        // ── ۳. رها کردن ماوس با مومنتوم ملایم ──
        const onMouseUp = () => {
            if (!isDownRef.current) return
            isDownRef.current = false

            el.classList.remove('cursor-grabbing', 'select-none')

            // اینرسی ملایم بعد از رها کردن
            let vel = velocityRef.current * 1.2
            const stepInertia = () => {
                if (Math.abs(vel) > 0.5) {
                    el.scrollLeft -= vel
                    vel *= 0.92 // اصطکاک نرم
                    animIdRef.current = requestAnimationFrame(stepInertia)
                } else {
                    animIdRef.current = null
                }
            }

            if (Math.abs(vel) > 2) {
                animIdRef.current = requestAnimationFrame(stepInertia)
            }

            // جلوگیری از کلیک روی دکمه‌ها پس از درگ
            setTimeout(() => {
                hasDraggedRef.current = false
            }, 60)
        }

        // ── ۴. تبدیل غلتک عمودی ماوس به اسکرول افقی ──
        const onWheel = (e: WheelEvent) => {
            // اگر کاربر غلتک عمودی چرخاند و در انتهای اسکرول نبود
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                const canScrollLeft = el.scrollLeft > 0
                const canScrollRight = el.scrollLeft < (el.scrollWidth - el.clientWidth - 1)

                // در جهت‌های قابل اسکرول، جلوی اسکرول صفحه رو بگیر و افقی اسکرول کن
                if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
                    e.preventDefault()
                    el.scrollLeft += e.deltaY * 0.9
                }
            }
        }

        // ── ۵. بلاک کردن کلیک در فاز Capture اگر درگ اتفاق افتاده باشد ──
        const onClickCapture = (e: MouseEvent) => {
            if (hasDraggedRef.current) {
                e.preventDefault()
                e.stopPropagation()
            }
        }

        el.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mousemove', onMouseMove, { passive: true })
        window.addEventListener('mouseup', onMouseUp)
        el.addEventListener('wheel', onWheel, { passive: false })
        el.addEventListener('click', onClickCapture, true)

        return () => {
            el.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            el.removeEventListener('wheel', onWheel)
            el.removeEventListener('click', onClickCapture, true)

            if (animIdRef.current) {
                cancelAnimationFrame(animIdRef.current)
            }
        }
    }, [])

    return ref
}
