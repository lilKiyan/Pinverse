import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createNotification, removeNotification } from '@/lib/notifications'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser()
        const { id } = await params

        const followersCount = await prisma.follow.count({
            where: { followingId: id }
        })

        let isFollowing = false
        if (user) {
            const follow = await prisma.follow.findFirst({
                where: {
                    followerId: user.id,
                    followingId: id,
                },
            })
            isFollowing = !!follow
        }

        return NextResponse.json({ isFollowing, followersCount })
    } catch (error) {
        console.error('GET /api/users/[id]/follow error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت وضعیت فالو' },
            { status: 500 }
        )
    }
}

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
                { error: 'برای دنبال کردن وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params
        if (user.id === id) {
            return NextResponse.json(
                { error: 'نمی‌توانید خودتان را دنبال کنید' },
                { status: 400 }
            )
        }
        const targetUser = await prisma.user.findUnique({ where: { id } })

        if (!targetUser) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        const existingFollow = await prisma.follow.findFirst({
            where: {
                followerId: user.id,
                followingId: id,
            },
        })

        let isFollowing: boolean

        if (existingFollow) {
            await prisma.follow.delete({
                where: { id: existingFollow.id },
            })
            isFollowing = false

            await removeNotification({
                type: 'follow',
                recipientId: id,
                actorId: user.id,
            })
        } else {
            await prisma.follow.create({
                data: {
                    followerId: user.id,
                    followingId: id,
                },
            })
            isFollowing = true

            await createNotification({
                type: 'follow',
                recipientId: id,
                actorId: user.id,
            })
        }

        const followersCount = await prisma.follow.count({
            where: { followingId: id },
        })

        return NextResponse.json({ isFollowing, followersCount })
    } catch (error) {
        console.error('POST /api/users/[id]/follow error:', error)
        return NextResponse.json(
            { error: 'خطا در دنبال کردن' },
            { status: 500 }
        )
    }
}