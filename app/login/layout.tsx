import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'ورود به حساب کاربری',
    description: 'ورود سریع و امن به حساب کاربری در پلتفرم PInverse.',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>
}
