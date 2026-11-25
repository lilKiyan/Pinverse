import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { validateMessageLength } from '@/lib/validations'
import { createNotification } from '@/lib/notifications'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { moderateText } from '@/lib/moderation'   

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پیام‌ها وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'شما عضو این گفتگو نیستید' },
                { status: 403 }
            )
        }
        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                    },
                },
                pin: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        imageWidth: true,
                        imageHeight: true,
                    },
                },
            },
        })

        return NextResponse.json({ messages })
    } catch (error) {
        console.error('GET /api/conversations/[id]/messages error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پیام‌ها' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const rl = rateLimit(getClientIp(request), { limit: 10, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json(
                { error: `کمی آرام‌تر! ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
            )
        }

        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای ارسال پیام وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        const participant = await prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId: id,
                    userId: user.id,
                },
            },
        })

        if (!participant) {
            return NextResponse.json(
                { error: 'شما عضو این گفتگو نیستید' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { content } = body

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: 'متن پیام نمی‌تواند خالی باشد' },
                { status: 400 }
            )
        }

        const trimmed = content.trim()

        const contentError = validateMessageLength(trimmed)
        if (contentError) {
            return NextResponse.json({ error: contentError }, { status: 400 })
        }

        const moderation = moderateText(trimmed, true)
        if (!moderation.ok) {
            return NextResponse.json({ error: moderation.reason }, { status: 400 })
        }

        const newMessage = await prisma.message.create({
            data: {
                conversationId: id,
                senderId: user.id,
                content: trimmed,
            },
            include: {
                sender: {
                    select: { id: true, name: true, username: true, avatar: true },
                },
            },
        })

        await prisma.conversation.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        const recipient = await prisma.conversationParticipant.findFirst({
            where: {
                conversationId: id,
                userId: { not: user.id },
            },
            select: { userId: true },
        })

        if (recipient) {
            await createNotification({
                type: 'message',
                recipientId: recipient.userId,
                actorId: user.id,
            })
        }

        return NextResponse.json({ message: newMessage }, { status: 201 })
    } catch (error) {
        console.error('POST /api/conversations/[id]/messages error:', error)
        return NextResponse.json(
            { error: 'خطا در ارسال پیام' },
            { status: 500 }
        )
    }
}