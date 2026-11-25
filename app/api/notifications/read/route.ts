import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json().catch(() => ({}))
        const { id, unread } = body as { id?: string; unread?: boolean }

        if (id) {
            const current = await prisma.notification.findFirst({
                where: { id, userId: user.id },
                select: { isRead: true },
            })

            if (!current) {
                return NextResponse.json(
                    { error: 'اعلان یافت نشد' },
                    { status: 404 }
                )
            }

            const newIsRead = unread ? false : !current.isRead

            const [, updatedUser] = await prisma.$transaction([
                prisma.notification.updateMany({
                    where: {
                        id,
                        userId: user.id,
                    },
                    data: { isRead: newIsRead },
                }),
                prisma.user.update({
                    where: { id: user.id },
                    data: {
                        unreadNotifications: newIsRead
                            ? { decrement: 1 }
                            : { increment: 1 },
                    },
                }),
            ])

            return NextResponse.json({
                isRead: newIsRead,
                unreadCount: updatedUser.unreadNotifications,
            })
        }

        const result = await prisma.notification.updateMany({
            where: {
                userId: user.id,
                isRead: false,
            },
            data: { isRead: true },
        })

        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { unreadNotifications: { decrement: result.count } },
        })

        return NextResponse.json({
            markedCount: result.count,
            unreadCount: Math.max(0, updatedUser.unreadNotifications),
        })
    } catch (error) {
        console.error('POST /api/notifications/read error:', error)
        return NextResponse.json(
            { error: 'خطا در علامت‌گذاری اعلان‌ها' },
            { status: 500 }
        )
    }
}