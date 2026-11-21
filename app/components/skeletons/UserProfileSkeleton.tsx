"use client"

import PinGridSkeleton from './PinGridSkeleton'

export default function UserProfileSkeleton() {
    return (
        <main dir="rtl" className="min-h-screen bg-white pb-20" aria-busy="true">
            {/* ═══ هدر گرادیانت پروفایل ═══ */}
            <div className="relative bg-gradient-to-b from-rose-50/60 via-red-50/20 to-white pt-10 pb-8 px-4">
                <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
                    {/* آواتار کاربر */}
                    <div className="relative mb-4">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full skeleton-shimmer ring-4 ring-white shadow-xl shadow-red-100/50" />
                    </div>

                    {/* نام و یوزرنیم */}
                    <div className="space-y-2 mb-4 w-full flex flex-col items-center">
                        <div className="h-6 w-44 bg-gray-200 rounded-lg skeleton-shimmer" />
                        <div className="h-4 w-28 bg-gray-100 rounded skeleton-shimmer" />
                    </div>

                    {/* بیو */}
                    <div className="space-y-1.5 mb-6 w-full max-w-sm flex flex-col items-center">
                        <div className="h-3.5 w-3/4 bg-gray-100 rounded skeleton-shimmer" />
                        <div className="h-3.5 w-1/2 bg-gray-100 rounded skeleton-shimmer" />
                    </div>

                    {/* آمار دنبال‌کنندگان و دنبال‌شوندگان */}
                    <div className="flex items-center justify-center gap-8 py-3 px-6 rounded-2xl bg-white/80 ring-1 ring-black/5 shadow-sm">
                        <div className="space-y-1">
                            <div className="h-5 w-12 bg-gray-200 rounded skeleton-shimmer mx-auto" />
                            <div className="h-3 w-16 bg-gray-100 rounded" />
                        </div>
                        <div className="w-px h-8 bg-gray-100" />
                        <div className="space-y-1">
                            <div className="h-5 w-12 bg-gray-200 rounded skeleton-shimmer mx-auto" />
                            <div className="h-3 w-16 bg-gray-100 rounded" />
                        </div>
                    </div>

                    {/* دکمه فالو */}
                    <div className="mt-6">
                        <div className="w-32 h-10 rounded-full bg-gray-200 skeleton-shimmer" />
                    </div>
                </div>
            </div>

            {/* ═══ فید پین‌های کاربر ═══ */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-8 mt-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-7 h-7 rounded-lg bg-gray-100" />
                    <div className="h-4 w-32 bg-gray-200 rounded skeleton-shimmer" />
                    <div className="flex-1 h-px bg-gray-100" />
                </div>
                <PinGridSkeleton count={10} />
            </div>
        </main>
    )
}
