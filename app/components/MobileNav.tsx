"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUnreadCount } from '@/lib/useUnreadCount'
import {
    FiHome,
    FiPlus,
    FiGrid,
    FiBell,
    FiMessageCircle,
} from 'react-icons/fi'
import { useNotificationsCount } from '@/lib/useNotificationsCount'

const MobileNav = () => {
    const pathname = usePathname()
    const unreadCount = useUnreadCount()
    const notificationCount = useNotificationsCount()

    if (pathname.startsWith('/messages/')) {
        return null
    }

    const navItems = [
        { href: '/', icon: FiHome, label: 'خانه' },
        { href: '/updates', icon: FiBell, label: 'اعلان‌ها' },
        { href: '/myboards', icon: FiGrid, label: 'بردها' },
        { href: '/messages', icon: FiMessageCircle, label: 'پیام‌ها' },
    ]

    const isCreateActive = pathname === '/create'
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-2 pointer-events-none">
            <div className="flex items-center justify-center gap-2.5">

                <Link
                    href="/create"
                    aria-label="ساخت پین"
                    className="pointer-events-auto relative w-13 h-13 md:w-14 md:h-14 rounded-full flex items-center justify-center no-underline group
                        bg-gradient-to-br from-red-500 via-red-600 to-rose-600
                        shadow-[0_8px_24px_-6px_rgba(239,68,68,0.55),0_2px_6px_rgba(239,68,68,0.3)]
                        hover:shadow-[0_10px_28px_-6px_rgba(239,68,68,0.65)]
                        hover:-translate-y-0.5 active:scale-90
                        transition-all duration-300"
                >
                    {!isCreateActive && (
                        <span className="absolute inset-0 rounded-full bg-red-500/30 blur-md animate-[radarPulse_2.4s_ease-out_infinite] pointer-events-none" />
                    )}

                    <FiPlus
                        className={`relative w-6 h-6 text-white drop-shadow transition-transform duration-500 ease-out
                            ${isCreateActive ? 'rotate-[135deg] scale-110' : 'group-hover:rotate-90'}`}
                    />
                </Link>

                <div
                    className="pointer-events-auto flex items-center gap-0.5 bg-gray-100/60 backdrop-blur-2xl rounded-full p-1.5
                        shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.05)]
                        ring-1 ring-black/5"
                >
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const showNotificationBadge = item.href === '/updates' && notificationCount > 0
                        const active =
                            item.href === '/'
                                ? pathname === '/'
                                : pathname === item.href || pathname.startsWith(`${item.href}/`)

                        const showBadge = item.href === '/messages' && unreadCount > 0

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                aria-label={item.label}
                                className={`relative flex items-center h-11 rounded-full no-underline group
                                    transition-all duration-300 ease-out
                                    ${active
                                        ? 'bg-gray-100/70 shadow-[0_3px_12px_rgba(0,0,0,0.12),0_1px_3px_rgba(0,0,0,0.06)] px-4 animate-[pillPop_0.35s_cubic-bezier(0.34,1.56,0.64,1)]'
                                        : 'px-3.5 hover:bg-white/60 active:scale-95'
                                    }`}
                            >
                                <span className="relative flex shrink-0">
                                    <Icon
                                        className={`w-[19px] h-[19px] transition-all duration-300
                                            ${active
                                                ? 'text-red-600 scale-110 drop-shadow-[0_1px_4px_rgba(239,68,68,0.35)] animate-[iconPop_0.45s_cubic-bezier(0.34,1.56,0.64,1)]'
                                                : 'text-gray-500 group-hover:text-gray-800 group-hover:scale-105'
                                            }`}
                                    />

                                    {showBadge && (
                                        <span className="absolute -top-0.5 -left-1 flex">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-white shadow-sm" />
                                        </span>
                                    )}
                                    {showNotificationBadge && (
                                        <span className="absolute -top-1.5 -left-1.5 min-w-[15px] h-[15px] px-1 rounded-full
        bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-white shadow-sm
        flex items-center justify-center text-[8px] font-extrabold text-white tabular-nums">
                                            {notificationCount > 9 ? '۹+' : notificationCount}
                                        </span>
                                    )}
                                </span>

                                <span
                                    className={`overflow-hidden whitespace-nowrap text-[12px] font-bold transition-all duration-300 ease-out
                                        ${active
                                            ? 'max-w-[90px] opacity-100 mr-1.5 text-red-600'
                                            : 'max-w-0 opacity-0 mr-0 text-gray-600'
                                        }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>

            <style>{`
                @keyframes pillPop {
                    0%   { transform: scale(0.85); }
                    60%  { transform: scale(1.04); }
                    100% { transform: scale(1); }
                }
                @keyframes iconPop {
                    0%   { transform: scale(0.6); }
                    60%  { transform: scale(1.25); }
                    100% { transform: scale(1.1); }
                }
                @keyframes radarPulse {
                    0%   { transform: scale(0.9); opacity: 0.5; }
                    100% { transform: scale(1.35); opacity: 0; }
                }
                @media (prefers-reduced-motion: reduce) {
                    * { animation: none !important; }
                }
            `}</style>
        </nav>
    )
}

export default MobileNav