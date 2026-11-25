import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پیام‌ها وارد شوید' },
                { status: 401 }
            )
        }

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId: user.id },
                },
            },
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
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        content: true,
                        createdAt: true,
                        isRead: true,
                        senderId: true, 
                        pinId: true,     
                    },
                },
            },
            orderBy: { updatedAt: 'desc' },
        })

        const formatted = await Promise.all(conversations.map(async (conv) => {
            const otherParticipant = conv.participants.find(p => p.userId !== user.id);

            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: conv.id,
                    senderId: otherParticipant?.userId,
                    isRead: false,
                },
            });

            return {
                id: conv.id,
                otherUser: otherParticipant?.user || null,
                lastMessage: conv.messages[0] || null,
                unreadCount,
                updatedAt: conv.updatedAt,
            };
        }));

        return NextResponse.json({ conversations: formatted })
    } catch (error) {
        console.error('GET /api/conversations error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت گفتگوها' },
            { status: 500 }
        )
    }
}

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
        const { userId } = body

        if (!userId || userId === user.id) {
            return NextResponse.json(
                { error: 'کاربر مقصد نامعتبر است' },
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

        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: user.id } } },
                    { participants: { some: { userId } } },
                ],
            },
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
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        })

        if (existingConversation) {
            return NextResponse.json({ conversation: existingConversation })
        }

        const newConversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: user.id },
                        { userId },
                    ],
                },
            },
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
                messages: true,
            },
        })

        return NextResponse.json(
            { conversation: newConversation },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/conversations error:', error)
        return NextResponse.json(
            { error: 'خطا در ایجاد گفتگو' },
            { status: 500 }
        )
    }
}