import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: Request) {
    try {
        const admin = await requireAdmin('stats.view')
        if (!admin) {
            return NextResponse.json(
                { error: 'دسترسی ندارید' },
                { status: 403 }
            )
        }

        const rl = rateLimit(getClientIp(request), { limit: 60, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const [totalUsers, totalPins, pendingPins, totalReports, pendingReports, totalLikes, totalMessages] =
            await Promise.all([
                prisma.user.count(),
                prisma.pin.count(),
                prisma.pin.count({ where: { status: 'PENDING' } }),
                prisma.report.count(),
                prisma.report.count({ where: { status: 'pending' } }),
                prisma.like.count(),
                prisma.message.count(),
            ])

        return NextResponse.json({
            stats: {
                totalUsers,
                totalPins,
                pendingPins,
                totalReports,
                pendingReports,
                totalLikes,
                totalMessages,
            },
        })
    } catch (error) {
        console.error('GET /api/admin/stats error:', error)
        return NextResponse.json({ error: 'خطا در دریافت آمار' }, { status: 500 })
    }
}