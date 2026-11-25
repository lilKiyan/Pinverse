"use client"

type BoardGridSkeletonProps = {
    count?: number
}

export default function BoardGridSkeleton({ count = 6 }: BoardGridSkeletonProps) {
    const items = Array.from({ length: count })

    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            aria-busy="true"
            aria-label="در حال بارگذاری بردها..."
        >
            {items.map((_, index) => (
                <div key={index} className="space-y-2 animate-[fadeIn_0.3s_ease-out]">
                    <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 ring-1 ring-black/5 shadow-sm p-0.5 grid grid-cols-2 gap-0.5">
                        <div className="skeleton-shimmer h-full w-full" />
                        <div className="skeleton-shimmer h-full w-full" />
                        <div className="skeleton-shimmer h-full w-full" />
                        <div className="skeleton-shimmer h-full w-full" />
                    </div>

                    <div className="px-1 space-y-1.5">
                        <div className="h-3.5 w-3/4 bg-gray-200 rounded-md skeleton-shimmer" />
                        <div className="h-2.5 w-1/3 bg-gray-100 rounded skeleton-shimmer" />
                    </div>
                </div>
            ))}
        </div>
    )
}
