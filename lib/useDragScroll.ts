"use client"

import { useEffect, useRef } from 'react'

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

        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 0) return
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

        const onMouseMove = (e: MouseEvent) => {
            if (!isDownRef.current) return

            const deltaX = e.clientX - prevXRef.current
            prevXRef.current = e.clientX
            velocityRef.current = deltaX

            if (Math.abs(e.clientX - startXRef.current) > 4) {
                hasDraggedRef.current = true
            }

            el.scrollLeft -= deltaX
        }

        const onMouseUp = () => {
            if (!isDownRef.current) return
            isDownRef.current = false

            el.classList.remove('cursor-grabbing', 'select-none')

            let vel = velocityRef.current * 1.25

            const stepInertia = () => {
                if (Math.abs(vel) > 0.4) {
                    el.scrollLeft -= vel
                    vel *= 0.92
                    animIdRef.current = requestAnimationFrame(stepInertia)
                } else {
                    animIdRef.current = null
                }
            }

            if (Math.abs(vel) > 1.5) {
                animIdRef.current = requestAnimationFrame(stepInertia)
            }

            setTimeout(() => {
                hasDraggedRef.current = false
            }, 100)
        }

        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                e.preventDefault()
                el.scrollLeft += e.deltaY * 0.9
            }
        }

        const onDragStart = (e: DragEvent) => {
            e.preventDefault()
        }

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
        el.addEventListener('dragstart', onDragStart)
        el.addEventListener('click', onClickCapture, true)

        return () => {
            el.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
            el.removeEventListener('wheel', onWheel)
            el.removeEventListener('dragstart', onDragStart)
            el.removeEventListener('click', onClickCapture, true)

            if (animIdRef.current) {
                cancelAnimationFrame(animIdRef.current)
            }
        }
    }, [])

    return ref
}
