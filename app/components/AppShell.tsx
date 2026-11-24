"use client"

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import MobileNav from './MobileNav'
import BootScreen from './BootScreen'

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isAdmin = pathname.startsWith('/admin')

    if (isAdmin) {
        return (
            <div className="min-h-screen w-full bg-[#FAFAFB]">
                <BootScreen />
                {children}
            </div>
        )
    }

    return (
        <>
            <BootScreen />
            <div className="flex h-dvh overflow-hidden">
                <Sidebar />
                <div className="flex-1 min-w-0 flex flex-col h-full">
                    <Navbar />
                    <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
                </div>
            </div>
            <MobileNav />
        </>
    )
}
