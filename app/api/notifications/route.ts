import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده اعلان‌ها وارد شوید' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const cursor = searchParams.get('cursor')

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            select: {
                id: true,
                type: true,
                message: true,
                isRead: true,
                createdAt: true,
                pinId: true,
                actor: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        return NextResponse.json({
            notifications,
            nextCursor: notifications.length === 20 ? notifications[notifications.length - 1].id : null,
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'خطا در دریافت اعلان‌ها' },
            { status: 500 }
        )
    }
}