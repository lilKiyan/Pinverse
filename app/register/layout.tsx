import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'ایجاد حساب کاربری',
    description: 'عضویت رایگان در PInverse و اشتراک‌گذاری ایده‌ها و تصاویر خلاقانه.',
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
