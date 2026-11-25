import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function GET(request: Request) {
    try {
        const admin = await requireAdmin('reports.view')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 60, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const reports = await prisma.report.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                id: true,
                reason: true,
                description: true,
                createdAt: true,
                pin: {
                    select: {
                        id: true,
                        title: true,
                        imageUrl: true,
                        user: {
                            select: { id: true, username: true, name: true },
                        },
                    },
                },
                reporter: {
                    select: { id: true, username: true, name: true },
                },
            },
        })

        return NextResponse.json({ reports })
    } catch (error) {
        console.error('GET /api/admin/reports error:', error)
        return NextResponse.json({ error: 'خطا در دریافت گزارش‌ها' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const admin = await requireAdmin('reports.resolve')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const rl = rateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json({ error: 'کمی آرام‌تر!' }, { status: 429 })
        }

        const body = await request.json()
        const { reportId, action } = body as { reportId?: string; action?: 'delete-pin' | 'dismiss' }

        if (!reportId || !action || !['delete-pin', 'dismiss'].includes(action)) {
            return NextResponse.json(
                { error: 'reportId و action معتبر لازم است' },
                { status: 400 }
            )
        }

        const report = await prisma.report.findUnique({
            where: { id: reportId },
            select: { id: true, pinId: true, status: true },
        })

        if (!report) {
            return NextResponse.json({ error: 'گزارش یافت نشد' }, { status: 404 })
        }

        if (action === 'delete-pin') {
            await prisma.$transaction(async (tx) => {
                await tx.report.deleteMany({ where: { pinId: report.pinId } })
                await tx.notification.deleteMany({ where: { pinId: report.pinId } })
                await tx.message.updateMany({
                    where: { pinId: report.pinId },
                    data: { pinId: null },
                })
                await tx.save.deleteMany({ where: { pinId: report.pinId } })
                await tx.like.deleteMany({ where: { pinId: report.pinId } })
                await tx.comment.deleteMany({ where: { pinId: report.pinId } })
                await tx.pin.delete({ where: { id: report.pinId } })
            })

            return NextResponse.json({ message: 'پین حذف شد و گزارش‌ها بسته شدند' })
        }

        await prisma.report.updateMany({
            where: { pinId: report.pinId },
            data: { status: 'resolved' },
        })

        return NextResponse.json({ message: 'گزارش رد شد و پین باقی ماند' })
    } catch (error) {
        console.error('POST /api/admin/reports error:', error)
        return NextResponse.json({ error: 'خطا در رسیدگی به گزارش' }, { status: 500 })
    }
}