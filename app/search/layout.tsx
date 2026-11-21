import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'جستجوی تصاویر و کاربران',
    description: 'جستجو در میان پین‌ها، تصاویر و کاربران PInverse',
    robots: {
        index: false,
        follow: true,
    },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
