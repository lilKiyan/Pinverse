import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای حذف اعلان وارد شوید' },
                { status: 401 }
            )
        }

        const notification = await prisma.notification.findFirst({
            where: {
                id,
                userId: user.id,
            },
            select: { isRead: true },
        })

        if (!notification) {
            return NextResponse.json(
                { error: 'اعلان یافت نشد' },
                { status: 404 }
            )
        }

        await prisma.$transaction(async (tx) => {
            await tx.notification.delete({
                where: { id },
            })

            if (!notification.isRead) {
                await tx.user.update({
                    where: { id: user.id },
                    data: { unreadNotifications: { decrement: 1 } },
                })
            }
        })

        return NextResponse.json({ message: 'اعلان حذف شد' })
    } catch (error) {
        console.error('DELETE /api/notifications/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف اعلان' },
            { status: 500 }
        )
    }
}