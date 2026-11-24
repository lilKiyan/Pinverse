"use client"

import React from 'react'
import {
    FiFlag,
    FiUsers,
    FiShield,
    FiImage,
    FiHeart,
    FiTag,
} from 'react-icons/fi'
import { Stats, Tab } from '../types'

type AdminStatsOverviewProps = {
    stats: Stats
    categoriesCount: number
    rolesCount: number
    onSelectTab: (tab: Tab) => void
}

export default function AdminStatsOverview({
    stats,
    categoriesCount,
    rolesCount,
    onSelectTab,
}: AdminStatsOverviewProps) {
    const cards = [
        {
            key: 'pending',
            icon: FiFlag,
            label: 'گزارش باز',
            value: stats.pendingReports,
            alert: stats.pendingReports > 0,
            iconBg: stats.pendingReports > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600',
            onClick: () => onSelectTab('reports'),
        },
        {
            key: 'users',
            icon: FiUsers,
            label: 'کاربران',
            value: stats.totalUsers,
            iconBg: 'bg-blue-50 text-blue-600',
            onClick: () => onSelectTab('users'),
        },
        {
            key: 'roles',
            icon: FiShield,
            label: 'نقش‌ها و سطح دسترسی',
            value: rolesCount,
            iconBg: 'bg-purple-50 text-purple-600',
            onClick: () => onSelectTab('roles'),
        },
        {
            key: 'pins',
            icon: FiImage,
            label: 'کل پین‌ها',
            value: stats.totalPins,
            iconBg: 'bg-rose-50 text-rose-600',
            onClick: () => onSelectTab('pins'),
        },
        {
            key: 'likes',
            icon: FiHeart,
            label: 'کل لایک‌ها',
            value: stats.totalLikes,
            iconBg: 'bg-pink-50 text-pink-600',
        },
        {
            key: 'categories',
            icon: FiTag,
            label: 'دسته‌بندی‌ها',
            value: categoriesCount,
            iconBg: 'bg-amber-50 text-amber-600',
            onClick: () => onSelectTab('categories'),
        },
    ]

    return (
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-[fadeInUp_0.35s_ease-out_40ms_backwards]">
            {cards.map((item) => {
                const Icon = item.icon
                const InteractiveTag = item.onClick ? 'button' : 'div'

                return (
                    <InteractiveTag
                        key={item.key}
                        type={item.onClick ? 'button' : undefined}
                        onClick={item.onClick}
                        className={`group text-right rounded-2xl p-3.5 sm:p-4 ring-1 transition-all duration-200 flex flex-col justify-between gap-3 ${
                            item.alert
                                ? 'bg-red-50/80 ring-red-200/90 hover:ring-red-300'
                                : 'bg-white ring-gray-200/75 shadow-2xs hover:ring-gray-300'
                        } ${item.onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : ''}`}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span
                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${item.iconBg}`}
                            >
                                <Icon className="h-4 w-4" />
                            </span>
                            {item.alert && (
                                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                                    فوری
                                </span>
                            )}
                        </div>

                        <div>
                            <p
                                className={`text-lg sm:text-xl font-black tabular-nums leading-none ${
                                    item.alert ? 'text-red-700' : 'text-gray-900'
                                }`}
                            >
                                {item.value.toLocaleString('fa-IR')}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-gray-500">
                                {item.label}
                            </p>
                        </div>
                    </InteractiveTag>
                )
            })}
        </section>
    )
}
