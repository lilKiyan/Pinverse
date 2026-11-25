import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'وارد شوید' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim() || ''

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: { some: { userId: user.id } },
                ...(q ? {
                    participants: {
                        some: {
                            userId: { not: user.id },
                            user: {
                                OR: [
                                    { name: { contains: q } },
                                    { username: { contains: q } },
                                ],
                            },
                        },
                    },
                } : {}),
            },
            orderBy: { updatedAt: 'desc' },
            take: 10,
            select: {
                id: true,
                updatedAt: true,
                participants: {
                    select: {
                        userId: true,
                        user: {
                            select: { id: true, name: true, username: true, avatar: true },
                        },
                    },
                },
            },
        })

        const followed = await prisma.follow.findMany({
            where: {
                followerId: user.id,
                ...(q ? {
                    following: {
                        OR: [
                            { name: { contains: q } },
                            { username: { contains: q } },
                        ],
                    },
                } : {}),
            },
            take: 15,
            orderBy: { createdAt: 'desc' },
            select: {
                followingId: true,
                following: {
                    select: { id: true, name: true, username: true, avatar: true },
                },
            },
        })

        const chatTargets = conversations
            .map((conv) => {
                const other = conv.participants.find((p) => p.userId !== user.id)
                return other?.user ?? null
            })
            .filter((u): u is NonNullable<typeof u> => u !== null)

        const chatIds = new Set(chatTargets.map((u) => u.id))

        const followedTargets = followed
            .map((f) => f.following)
            .filter((u) => !chatIds.has(u.id))

        return NextResponse.json({
            chats: chatTargets,
            followed: followedTargets,
        })
    } catch (error) {
        console.error('GET /api/pins/share-targets error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت مخاطبین' },
            { status: 500 }
        )
    }
}