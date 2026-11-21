import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'دسته‌بندی‌های موضوعی',
    description: 'تمام دسته‌بندی‌های موضوعی PInverse: هنر، آشپزی، تکنولوژی، معماری، عکاسی و ایده‌های خلاقانه.',
    alternates: {
        canonical: '/categories',
    },
    openGraph: {
        title: 'دسته‌بندی‌های موضوعی PInverse',
        description: 'تمام دسته‌بندی‌های موضوعی PInverse: هنر، آشپزی، تکنولوژی، معماری، عکاسی و ایده‌های خلاقانه.',
    },
}

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
