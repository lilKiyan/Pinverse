import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پین‌های خود وارد شوید' },
                { status: 401 }
            )
        }

        const pins = await prisma.pin.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                saves: {
                    where: { userId: user.id },
                    include: { board: true },
                },
                category: {
                    select: { slug: true, name: true, icon: true, color: true },
                },
                _count: {
                    select: { images: true },
                },
            },
        })

        const myPins = pins.map((pin) => {
            const userSaves = pin.saves
            return {
                id: pin.id,
                title: pin.title,
                imageWidth: pin.imageWidth,
                imageHeight: pin.imageHeight,
                description: pin.description,
                imageUrl: pin.imageUrl,
                imagesCount: Math.max(1, pin._count.images),
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                status: pin.status,
                rejectionReason: pin.rejectionReason,
                isOwner: true,
                isSavedByMe: userSaves.length > 0,
                category: pin.category
                    ? {
                        slug: pin.category.slug,
                        name: pin.category.name,
                        icon: pin.category.icon,
                        color: pin.category.color,
                    }
                    : null,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        return NextResponse.json(myPins)
    } catch (error) {
        console.error('GET /api/pins/mine error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های من' },
            { status: 500 }
        )
    }
}