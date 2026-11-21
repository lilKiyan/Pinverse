"use client"

import PinGridSkeleton from './PinGridSkeleton'

export default function PinDetailSkeleton() {
    return (
        <main dir="rtl" className="min-h-screen bg-gradient-to-br from-red-50/40 via-white to-orange-50/30 p-3 sm:p-4 md:p-8" aria-busy="true">
            <div className="max-w-[1200px] mx-auto space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white shadow-sm ring-1 ring-black/5 skeleton-shimmer" />
                    <div className="h-4 w-24 bg-gray-200 rounded-full" />
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 ring-1 ring-black/5 overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-12">
                        <div className="lg:col-span-7 bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-l border-gray-100">
                            <div className="w-full max-w-md aspect-[3/4] rounded-2xl skeleton-shimmer ring-1 ring-black/5" />
                        </div>

                        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 skeleton-shimmer" />
                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 skeleton-shimmer" />
                                        <div className="w-10 h-10 rounded-2xl bg-gray-100 skeleton-shimmer" />
                                    </div>
                                    <div className="w-28 h-10 rounded-full bg-red-100/60 skeleton-shimmer" />
                                </div>

                                <div className="space-y-3">
                                    <div className="h-6 w-3/4 bg-gray-200 rounded-lg skeleton-shimmer" />
                                    <div className="h-4 w-full bg-gray-100 rounded skeleton-shimmer" />
                                    <div className="h-4 w-2/3 bg-gray-100 rounded skeleton-shimmer" />
                                </div>

                                <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl ring-1 ring-black/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full skeleton-shimmer ring-2 ring-white shrink-0" />
                                        <div className="space-y-1.5">
                                            <div className="h-4 w-28 bg-gray-200 rounded skeleton-shimmer" />
                                            <div className="h-3 w-16 bg-gray-100 rounded skeleton-shimmer" />
                                        </div>
                                    </div>
                                    <div className="w-20 h-8 rounded-full bg-gray-200 skeleton-shimmer" />
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="h-4 w-20 bg-gray-200 rounded skeleton-shimmer" />
                                        <div className="h-3 w-10 bg-gray-100 rounded" />
                                    </div>
                                    <div className="flex items-start gap-2.5">
                                        <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
                                        <div className="flex-1 space-y-1.5 p-3 bg-gray-50 rounded-2xl">
                                            <div className="h-3 w-24 bg-gray-200 rounded" />
                                            <div className="h-3 w-4/5 bg-gray-100 rounded" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-12 w-full rounded-2xl bg-gray-100 skeleton-shimmer ring-1 ring-gray-200/50" />
                        </div>
                    </div>
                </div>

                <div className="pt-8 space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-red-100" />
                        <div className="h-5 w-32 bg-gray-200 rounded skeleton-shimmer" />
                    </div>
                    <PinGridSkeleton count={8} />
                </div>
            </div>
        </main>
    )
}
