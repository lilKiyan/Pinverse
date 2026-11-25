"use client"

type NotificationSkeletonProps = {
    count?: number
}

export default function NotificationSkeleton({ count = 7 }: NotificationSkeletonProps) {
    const items = Array.from({ length: count })

    return (
        <main
            dir="rtl"
            className="relative min-h-screen bg-gradient-to-b from-gray-50 to-white pb-24 lg:pb-10"
            aria-busy="true"
            aria-label="در حال بارگذاری اعلان‌ها..."
        >
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />

            <div className="relative max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-red-100/70 skeleton-shimmer shadow-sm" />
                        <div className="space-y-1.5">
                            <div className="h-6 w-28 bg-gray-200 rounded-lg skeleton-shimmer" />
                            <div className="h-3 w-16 bg-red-100/70 rounded-full skeleton-shimmer" />
                        </div>
                    </div>

                    <div className="h-8 w-24 bg-gray-100 rounded-full skeleton-shimmer hidden sm:block" />
                </div>

                <div className="inline-flex items-center gap-1 bg-gray-100/80 rounded-full p-1 mb-6">
                    <div className="w-20 h-7 rounded-full bg-white skeleton-shimmer shadow-sm" />
                    <div className="w-20 h-7 rounded-full bg-gray-200/50 skeleton-shimmer" />
                </div>

                <div className="space-y-2.5">
                    {items.map((_, i) => (
                        <div
                            key={i}
                            className="flex items-start gap-3 p-4 rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm animate-[fadeIn_0.3s_ease-out]"
                            style={{ animationDelay: `${i * 40}ms` }}
                        >
                            <div className="w-10 h-10 rounded-full bg-gray-200 skeleton-shimmer shrink-0" />

                            <div className="flex-1 space-y-2 pt-0.5">
                                <div
                                    className="h-4 bg-gray-200 rounded-md skeleton-shimmer"
                                    style={{ width: i % 3 === 0 ? '65%' : i % 3 === 1 ? '50%' : '75%' }}
                                />
                                <div className="h-3 w-20 bg-gray-100 rounded-md skeleton-shimmer" />
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gray-100 skeleton-shimmer" />
                                {i % 2 === 0 && (
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 skeleton-shimmer" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
