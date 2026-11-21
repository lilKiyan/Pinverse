"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiHome, FiPlus, FiBell, FiMessageCircle, FiSettings, FiGrid } from 'react-icons/fi'
import { useUnreadCount } from '@/lib/useUnreadCount'
import { useNotificationsCount } from '@/lib/useNotificationsCount'

const navItems = [
    { href: '/', icon: FiHome, label: 'خانه' },
    { href: '/myboards', icon: FiGrid, label: 'بردهای من' },
    { href: '/create', icon: FiPlus, label: 'ساخت پین' },
    { href: '/updates', icon: FiBell, label: 'اعلان‌ها' },
    { href: '/messages', icon: FiMessageCircle, label: 'پیام‌ها' },
]

const ITEM_HEIGHT = 48
const ITEM_GAP = 8

const isPathActive = (pathname: string, href: string) => {
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
}

const Sidebar = () => {
    const pathname = usePathname()
    const unreadCount = useUnreadCount()
    const notificationCount = useNotificationsCount()

    const activeIndex = navItems.findIndex((item) => isPathActive(pathname, item.href))
    const isSettingsActive = isPathActive(pathname, '/settings')

    return (
        <aside className="hidden lg:flex sticky top-0 h-screen shrink-0 w-20 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.05)] flex-col items-center py-4 z-50">
            <Link href="/">
                <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg shadow-red-100 hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                    <span className="h-[25px]">P</span>
                </div>
            </Link>

            <nav className="relative flex-1 flex flex-col items-center gap-2 w-full px-2">
                {activeIndex !== -1 && (
                    <div
                        className="absolute right-2 left-2 rounded-xl bg-red-50 transition-all duration-300 ease-out pointer-events-none"
                        style={{
                            height: ITEM_HEIGHT,
                            top: activeIndex * (ITEM_HEIGHT + ITEM_GAP),
                        }}
                    />
                )}

                {navItems.map((item) => {
                    const active = isPathActive(pathname, item.href)
                    const Icon = item.icon
                    // ✅ بج پیام‌ها
                    const showMessageBadge = item.href === '/messages' && unreadCount > 0
                    const showNotificationBadge = item.href === '/updates' && notificationCount > 0
                    const showBadge = item.href === '/messages' && unreadCount > 0

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative z-10 flex items-center justify-center w-12 h-12 rounded-xl transition-colors hover:bg-gray-100"
                        >
                            <span className="relative flex">
                                <Icon className={`w-6 h-6 transition-all duration-200 ${active ? 'text-red-600 scale-105' : 'text-gray-700'}`} />

                                {showMessageBadge && (
                                    <span className="absolute -top-0.5 -left-1 flex">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-white shadow-sm" />
                                    </span>
                                )}

                                {showNotificationBadge && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full
            bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-white shadow-sm
            flex items-center justify-center text-[9px] font-extrabold text-white tabular-nums">
                                        {notificationCount > 9 ? '۹+' : notificationCount}
                                    </span>
                                )}
                            </span>

                            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            <Link
                href="/settings"
                className="group relative flex items-center justify-center w-12 h-12 rounded-xl transition-colors hover:bg-gray-100"
            >
                {isSettingsActive && (
                    <span className="absolute inset-0 rounded-xl bg-red-50" />
                )}
                <FiSettings
                    className={`relative w-6 h-6 transition-all duration-200 ${isSettingsActive ? 'text-red-600 scale-105' : 'text-gray-700'
                        }`}
                />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
                    تنظیمات
                </span>
            </Link>
        </aside>
    )
}

export default Sidebar