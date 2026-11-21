import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'


export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()
        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim() || ''

        if (!q) {
            return NextResponse.json({ pins: [] })
        }

        const pins = await prisma.pin.findMany({
            where: {
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { description: { contains: q, mode: 'insensitive' } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                saves: {
                    where: user ? { userId: user.id } : { userId: '__NONE__' },
                    include: {
                        board: {
                            select: { id: true, name: true },
                        },
                    },
                },
                category: {
                    select: { slug: true, name: true, icon: true, color: true },
                },
            },
        })

        const pinsWithMeta = pins.map((pin) => {
            const userSaves = user ? pin.saves : []

            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                imageWidth: pin.imageWidth,
                imageHeight: pin.imageHeight,
                imageUrl: pin.imageUrl,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: false,
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

        return NextResponse.json({ pins: pinsWithMeta },
            {
                headers: {
                    'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
                },
            }
        )
    } catch (error) {
        console.error('GET /api/search error:', error)
        return NextResponse.json(
            { error: 'خطا در جستجو' },
            { status: 500 }
        )
    }
}