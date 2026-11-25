import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createNotification, removeNotification } from '@/lib/notifications'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const rl = rateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json(
                { error: `کمی آرام‌تر! ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
            )
        }

        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای لایک وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { userId: true, title: true },
        })
        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const existingLike = await prisma.like.findFirst({
            where: {
                userId: user.id,
                pinId: id,
            },
        })

        let isLiked: boolean

        if (existingLike) {
            await prisma.like.delete({
                where: { id: existingLike.id },
            })
            isLiked = false

            await removeNotification({
                type: 'like',
                recipientId: pin.userId,
                actorId: user.id,
                pinId: id,
            })
        } else {
            await prisma.like.create({
                data: {
                    userId: user.id,
                    pinId: id,
                },
            })
            isLiked = true

            await createNotification({
                type: 'like',
                recipientId: pin.userId,
                actorId: user.id,
                pinId: id,
                pinTitle: pin.title,
            })
        }

        const totalLikes = await prisma.like.count({
            where: { pinId: id },
        })

        return NextResponse.json({ isLiked, totalLikes })
    } catch (error) {
        console.error('POST /api/pins/[id]/like error:', error)
        return NextResponse.json(
            { error: 'خطا در لایک' },
            { status: 500 }
        )
    }
}