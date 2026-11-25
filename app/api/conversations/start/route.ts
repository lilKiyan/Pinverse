import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای شروع گفتگو وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { userId, content } = body

        if (!userId || !content?.trim()) {
            return NextResponse.json(
                { error: 'شناسه کاربر و متن پیام الزامی است' },
                { status: 400 }
            )
        }

        if (userId === user.id) {
            return NextResponse.json(
                { error: 'نمی‌توانید با خودتان چت کنید' },
                { status: 400 }
            )
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
        })
        if (!targetUser) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        let conversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: user.id } } },
                    { participants: { some: { userId } } },
                ],
            },
        })

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participants: {
                        create: [{ userId: user.id }, { userId }],
                    },
                },
            })
        }

        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId: user.id,
                content: content.trim(),
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        })

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json(
            {
                conversationId: conversation.id,
                message,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/conversations/start error:', error)
        return NextResponse.json(
            { error: 'خطا در شروع گفتگو' },
            { status: 500 }
        )
    }
}