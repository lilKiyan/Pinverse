import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

const LIMIT = 50

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const viewer = await getCurrentUser()

        // ── کاربر هدف باید وجود داشته باشد ──
        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, username: true, banned: true, avatar: true },
        })

        if (!targetUser) {
            return NextResponse.json(
                { error: 'کاربر یافت نشد' },
                { status: 404 }
            )
        }

        // ── پارامترها ──
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') === 'following' ? 'following' : 'followers'
        const cursor = searchParams.get('cursor')

        // ── شرط بر اساس نوع ──
        const whereCondition =
            type === 'followers'
                ? { followingId: id }        // کسانی که «او» را فالو کرده‌اند
                : { followerId: id }         // کسانی که «او» فالو کرده

        // ── واکشی لیست ──
        const connections = await prisma.follow.findMany({
            where: whereCondition,
            orderBy: { createdAt: 'desc' },
            take: LIMIT + 1,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                follower: {                    // ✅ رابطه
                    select: { id: true, name: true, username: true, avatar: true },
                },
                following: {                   // ✅ رابطه
                    select: { id: true, name: true, username: true, avatar: true },
                },
            },
        })

        // ── استخراج کاربرها از رابطه‌ها ──
        const users = connections.map((rel) =>
            type === 'followers' ? rel.follower : rel.following
        )

        // ── آیا viewer (من) این‌ها را فالو کرده‌ام؟ — یک کوئری، نه N! ──
        let followedByMeIds = new Set<string>()

        if (viewer && users.length > 0) {
            const myFollows = await prisma.follow.findMany({
                where: {
                    followerId: viewer.id,
                    followingId: { in: users.map((u) => u.id) },
                },
                select: { followingId: true },
            })
            followedByMeIds = new Set(myFollows.map((f) => f.followingId))
        }

        const items = users.map((u) => ({
            ...u,
            isFollowing: followedByMeIds.has(u.id),
        }))

        const hasMore = connections.length > LIMIT
        const nextCursor = hasMore ? connections[connections.length - 1].id : null

        return NextResponse.json({
            owner: {                 
                id: targetUser.id,
                name: targetUser.name,
                username: targetUser.username,
                avatar: targetUser.avatar,
            },
            users: items,
            nextCursor,
            type,
        })
    } catch (error) {
        console.error('GET /api/users/[id]/connections error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت لیست' },
            { status: 500 }
        )
    }
}