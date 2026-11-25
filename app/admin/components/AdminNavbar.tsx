"use client"

import React from 'react'
import Link from 'next/link'
import { FiArrowRight, FiShield, FiRefreshCw } from 'react-icons/fi'
import { Stats } from '../types'

type AdminNavbarProps = {
    stats?: Stats
    isRefreshing: boolean
    onRefresh: () => void
}

export default function AdminNavbar({ stats, isRefreshing, onRefresh }: AdminNavbarProps) {
    return (
        <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/95 backdrop-blur-md shadow-xs">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            aria-label="بازگشت به سایت"
                            className="group flex items-center gap-1.5 rounded-xl bg-gray-100 hover:bg-gray-900 px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-white transition-all duration-200 no-underline active:scale-95"
                        >
                            <FiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                            <span className="hidden sm:inline">بازگشت به سایت</span>
                        </Link>

                        <div className="h-5 w-px bg-gray-200 hidden sm:block" />

                        <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-sm shadow-red-500/25">
                                <FiShield className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-sm font-black tracking-tight text-gray-900">
                                        PInverse
                                    </span>
                                    <span className="rounded-md bg-red-100/80 px-1.5 py-0.2 text-[10px] font-extrabold text-red-700">
                                        Admin
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium hidden sm:block">
                                    سامانه مدیریت مرکزی
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {stats && (
                            <div className="hidden md:flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                                </span>
                                <span>سیستم فعال</span>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            title="بروزرسانی زنده داده‌ها"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white hover:bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-700 ring-1 ring-gray-200 shadow-2xs active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                        >
                            <FiRefreshCw
                                className={`h-3.5 w-3.5 text-gray-500 ${isRefreshing ? 'animate-spin' : ''}`}
                            />
                            <span className="hidden sm:inline">بروزرسانی</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
