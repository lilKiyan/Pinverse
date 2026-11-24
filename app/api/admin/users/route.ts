import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

// ── GET: لیست کاربران ──
export async function GET(request: Request) {
    try {
        const admin = await requireAdmin('users.view')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 60, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                email: true,
                banned: true,
                createdAt: true,
                roles: {
                    select: {
                        role: {
                            select: { id: true, name: true, description: true },
                        },
                    },
                },
                _count: {
                    select: { pins: true, followers: true },
                },
            },
        })

        return NextResponse.json({ users })
    } catch (error) {
        console.error('GET /api/admin/users error:', error)
        return NextResponse.json({ error: 'خطا در دریافت کاربران' }, { status: 500 })
    }
}

// ── POST: ban/unban ──
export async function POST(request: Request) {
    try {
        const admin = await requireAdmin('users.ban')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const body = await request.json()
        const { userId, banned } = body as { userId?: string; banned?: boolean }

        if (!userId || typeof banned !== 'boolean') {
            return NextResponse.json(
                { error: 'userId و banned لازم است' },
                { status: 400 }
            )
        }

        if (userId === admin.id) {
            return NextResponse.json(
                { error: 'نمی‌توانید خودتان را مسدود کنید' },
                { status: 400 }
            )
        }

        const target = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, banned: true },
        })

        if (!target) {
            return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
        }

        await prisma.user.update({
            where: { id: userId },
            data: { banned },
        })

        return NextResponse.json({
            message: banned ? 'کاربر مسدود شد' : 'کاربر آزاد شد',
        })
    } catch (error) {
        console.error('POST /api/admin/users error:', error)
        return NextResponse.json({ error: 'خطا در مدیریت کاربر' }, { status: 500 })
    }
}