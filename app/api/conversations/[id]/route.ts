import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده گفتگو وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        const conversation = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        })

        if (!conversation) {
            return NextResponse.json(
                { error: 'گفتگو یافت نشد' },
                { status: 404 }
            )
        }

        const isParticipant = conversation.participants.some(
            (p) => p.userId === user.id
        )
        if (!isParticipant) {
            return NextResponse.json(
                { error: 'شما عضو این گفتگو نیستید' },
                { status: 403 }
            )
        }

        const otherParticipant = conversation.participants.find(
            (p) => p.userId !== user.id
        )

        return NextResponse.json({
            otherUser: otherParticipant?.user || null,
        })
    } catch (error) {
        console.error('GET /api/conversations/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت گفتگو' },
            { status: 500 }
        )
    }
}