"use client"

import React from 'react'
import { getCategoryIcon } from '@/lib/categories'

type CategoryIconProps = {
    iconName: string | null | undefined
    className?: string   // سایز و رنگ با کلاس — مثل همه‌ی آیکون‌ها
}

export default function CategoryIcon({ iconName, className = 'w-4 h-4' }: CategoryIconProps) {
    const Icon = getCategoryIcon(iconName)
    return React.createElement(Icon, { className })
}