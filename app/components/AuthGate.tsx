"use client"

import Link from 'next/link'
import { FiLogIn } from 'react-icons/fi'

type AuthGateProps = {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
    buttonText?: string
    redirectUrl?: string
    showHomeLink?: boolean
    compact?: boolean
}

export default function AuthGate({
    icon: Icon,
    title,
    description,
    buttonText = 'ورود به حساب کاربری',
    redirectUrl,
    showHomeLink = true,
    compact = false,
}: AuthGateProps) {
    const loginHref = redirectUrl
        ? `/login?redirect=${encodeURIComponent(redirectUrl)}`
        : '/login'

    return (
        <main
            dir="rtl"
            className={`relative w-full flex flex-col items-center justify-center px-4 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-red-50/20 text-center ${
                compact ? 'py-12' : 'min-h-[75vh] pb-24 lg:pb-10'
            }`}
        >
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-sm w-full bg-white/95 backdrop-blur-xl rounded-3xl p-7 sm:p-8 shadow-xl shadow-red-100/30 ring-1 ring-black/5 flex flex-col items-center text-center space-y-4 animate-[fadeIn_0.3s_ease-out]">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white text-2xl shadow-lg shadow-red-200">
                    <Icon className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                        {title}
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="w-full flex flex-col gap-2 pt-1">
                    <Link
                        href={loginHref}
                        className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold py-3 px-6 rounded-xl shadow-md shadow-red-200 hover:shadow-lg hover:brightness-105 active:scale-95 transition-all text-sm no-underline"
                    >
                        <FiLogIn className="w-4 h-4" />
                        {buttonText}
                    </Link>

                    {showHomeLink && (
                        <Link
                            href="/"
                            className="w-full py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors no-underline"
                        >
                            بازگشت به صفحه اصلی
                        </Link>
                    )}
                </div>
            </div>
        </main>
    )
}
