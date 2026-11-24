"use client"

import React from 'react'
import {
    FiFlag,
    FiUsers,
    FiShield,
    FiImage,
    FiTag,
} from 'react-icons/fi'
import { Tab, Stats } from '../types'

type AdminTabsNavigationProps = {
    activeTab: Tab
    onSelectTab: (tab: Tab) => void
    stats: Stats
    categoriesCount: number
}

export default function AdminTabsNavigation({
    activeTab,
    onSelectTab,
    stats,
    categoriesCount,
}: AdminTabsNavigationProps) {
    const tabs = [
        {
            id: 'reports' as const,
            label: 'گزارش‌ها',
            icon: FiFlag,
            badge: stats.pendingReports > 0 ? stats.pendingReports : null,
            badgeColor: 'bg-red-600 text-white',
            activeClass: 'border-red-600 text-red-600 font-black',
        },
        {
            id: 'users' as const,
            label: 'کاربران',
            icon: FiUsers,
            badge: stats.totalUsers,
            badgeColor: 'bg-gray-100 text-gray-700',
            activeClass: 'border-blue-600 text-blue-600 font-black',
        },
        {
            id: 'roles' as const,
            label: 'نقش‌ها و سطح دسترسی',
            icon: FiShield,
            activeClass: 'border-purple-600 text-purple-600 font-black',
        },
        {
            id: 'pins' as const,
            label: 'مدیریت پین‌ها',
            icon: FiImage,
            badge: stats.totalPins,
            badgeColor: 'bg-gray-100 text-gray-700',
            activeClass: 'border-rose-600 text-rose-600 font-black',
        },
        {
            id: 'categories' as const,
            label: 'دسته‌بندی‌ها',
            icon: FiTag,
            badge: categoriesCount,
            badgeColor: 'bg-gray-100 text-gray-700',
            activeClass: 'border-amber-600 text-amber-600 font-black',
        },
    ]

    return (
        <div className="border-b border-gray-200/80 bg-white px-4 sm:px-6 pt-3">
            <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none -mb-px">
                {tabs.map((t) => {
                    const Icon = t.icon
                    const isActive = activeTab === t.id

                    return (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => onSelectTab(t.id)}
                            className={`group inline-flex items-center gap-2 border-b-2 px-3.5 sm:px-4 py-3 text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                                isActive
                                    ? `${t.activeClass} bg-gray-50/80 rounded-t-xl`
                                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                            }`}
                        >
                            <Icon
                                className={`h-4 w-4 transition-transform group-hover:scale-110 ${
                                    isActive ? '' : 'text-gray-400'
                                }`}
                            />
                            <span>{t.label}</span>
                            {t.badge != null && (
                                <span
                                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums leading-none ${t.badgeColor}`}
                                >
                                    {t.badge.toLocaleString('fa-IR')}
                                </span>
                            )}
                        </button>
                    )
                })}
            </nav>
        </div>
    )
}
