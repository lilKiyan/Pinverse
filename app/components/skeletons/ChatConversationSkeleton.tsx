"use client"

export default function ChatConversationSkeleton() {
    return (
        <div
            className="space-y-4 py-2"
            aria-busy="true"
            aria-label="در حال بارگذاری پیام‌ها..."
        >
            <div className="flex justify-end items-end gap-2 animate-[fadeIn_0.3s_ease-out]">
                <div className="space-y-1 max-w-[70%]">
                    <div className="p-3.5 rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-100 shadow-sm space-y-2">
                        <div className="h-3.5 w-48 bg-gray-200 rounded skeleton-shimmer" />
                        <div className="h-3.5 w-32 bg-gray-100 rounded skeleton-shimmer" />
                        <div className="h-2 w-10 bg-gray-100 rounded skeleton-shimmer mt-1" />
                    </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 skeleton-shimmer shrink-0 ring-2 ring-white shadow-sm" />
            </div>

            <div className="flex justify-start items-end gap-2 animate-[fadeIn_0.35s_ease-out]">
                <div className="space-y-1 max-w-[70%]">
                    <div className="p-3.5 rounded-2xl rounded-br-md bg-red-50/70 ring-1 ring-red-100/50 shadow-sm space-y-2">
                        <div className="h-3.5 w-40 bg-red-200/50 rounded skeleton-shimmer" />
                        <div className="h-2 w-10 bg-red-200/40 rounded skeleton-shimmer mt-1" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-end gap-2 animate-[fadeIn_0.4s_ease-out]">
                <div className="space-y-1 max-w-[75%]">
                    <div className="p-3 rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-100 shadow-sm space-y-2.5">
                        <div className="w-48 h-36 rounded-xl bg-gray-100 skeleton-shimmer ring-1 ring-black/5" />
                        <div className="space-y-1.5 px-0.5">
                            <div className="h-3.5 w-36 bg-gray-200 rounded skeleton-shimmer" />
                            <div className="h-3 w-24 bg-gray-100 rounded skeleton-shimmer" />
                        </div>
                        <div className="h-2 w-10 bg-gray-100 rounded skeleton-shimmer mt-1" />
                    </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 skeleton-shimmer shrink-0 ring-2 ring-white shadow-sm" />
            </div>

            <div className="flex justify-start items-end gap-2 animate-[fadeIn_0.45s_ease-out]">
                <div className="space-y-1 max-w-[70%]">
                    <div className="p-3.5 rounded-2xl rounded-br-md bg-red-50/70 ring-1 ring-red-100/50 shadow-sm space-y-2">
                        <div className="h-3.5 w-52 bg-red-200/50 rounded skeleton-shimmer" />
                        <div className="h-3.5 w-28 bg-red-200/40 rounded skeleton-shimmer" />
                        <div className="h-2 w-10 bg-red-200/40 rounded skeleton-shimmer mt-1" />
                    </div>
                </div>
            </div>

            <div className="flex justify-end items-end gap-2 animate-[fadeIn_0.5s_ease-out]">
                <div className="space-y-1 max-w-[70%]">
                    <div className="p-3.5 rounded-2xl rounded-bl-md bg-white ring-1 ring-gray-100 shadow-sm space-y-2">
                        <div className="h-3.5 w-24 bg-gray-200 rounded skeleton-shimmer" />
                        <div className="h-2 w-8 bg-gray-100 rounded skeleton-shimmer mt-1" />
                    </div>
                </div>
                <div className="w-7 h-7 rounded-full bg-gray-200 skeleton-shimmer shrink-0 ring-2 ring-white shadow-sm" />
            </div>

            <div className="flex justify-start items-end gap-2 animate-[fadeIn_0.55s_ease-out]">
                <div className="space-y-1 max-w-[70%]">
                    <div className="p-3.5 rounded-2xl rounded-br-md bg-red-50/70 ring-1 ring-red-100/50 shadow-sm space-y-2">
                        <div className="h-3.5 w-32 bg-red-200/50 rounded skeleton-shimmer" />
                        <div className="h-2 w-10 bg-red-200/40 rounded skeleton-shimmer mt-1" />
                    </div>
                </div>
            </div>
        </div>
    )
}
