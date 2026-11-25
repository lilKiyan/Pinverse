"use client"

const CARD_ASPECT_RATIOS = [
    'aspect-[3/4]',
    'aspect-[2/3]',
    'aspect-[4/5]',
    'aspect-[3/5]',
    'aspect-square',
    'aspect-[9/16]',
    'aspect-[4/5]',
    'aspect-[2/3]',
    'aspect-[3/4]',
    'aspect-square',
    'aspect-[3/5]',
    'aspect-[2/3]',
]

type PinGridSkeletonProps = {
    count?: number
    className?: string
}

export default function PinGridSkeleton({ count = 12, className = '' }: PinGridSkeletonProps) {
    const items = Array.from({ length: count })

    return (
        <div
            className={`columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4 ${className}`}
            aria-busy="true"
            aria-label="در حال بارگذاری پین‌ها..."
        >
            {items.map((_, index) => {
                const aspect = CARD_ASPECT_RATIOS[index % CARD_ASPECT_RATIOS.length]
                return (
                    <div
                        key={index}
                        className="group relative break-inside-avoid mb-4 animate-[fadeIn_0.4s_ease-out]"
                    >
                        <div
                            className={`w-full rounded-[15px] overflow-hidden skeleton-shimmer ring-1 ring-black/5 ${aspect}`}
                        >
                            <div className="absolute top-2.5 right-2.5 w-14 h-4 rounded-full bg-white/60 backdrop-blur-sm" />
                        </div>

                        <div className="mt-2 px-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div className="w-3.5 h-3.5 rounded-full bg-gray-200 shrink-0" />
                                <div className="h-2.5 w-24 bg-gray-200 rounded-full" />
                            </div>
                            <div className="w-5 h-5 rounded-full bg-gray-200/80 shrink-0" />
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
