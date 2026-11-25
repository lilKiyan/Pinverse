import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const REPORT_REASONS = ['spam', 'inappropriate', 'violence', 'hate', 'misinformation', 'other'] as const

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای گزارش کردن وارد شوید' },
                { status: 401 }
            )
        }

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { id: true },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { reason, description } = body

        if (!reason || !REPORT_REASONS.includes(reason)) {
            return NextResponse.json(
                { error: 'دلیل گزارش نامعتبر است' },
                { status: 400 }
            )
        }

        let cleanDescription: string | undefined
        if (typeof description === 'string' && description.trim()) {
            if (description.trim().length > 500) {
                return NextResponse.json(
                    { error: 'توضیح نمی‌تواند بیش از ۵۰۰ کاراکتر باشد' },
                    { status: 400 }
                )
            }
            cleanDescription = description.trim()
        }

        const existingReport = await prisma.report.findUnique({
            where: {
                reporterId_pinId: {
                    reporterId: user.id,
                    pinId: id,
                },
            },
        })

        if (existingReport) {
            return NextResponse.json(
                { error: 'شما قبلاً این پین را گزارش کرده‌اید' },
                { status: 409 }
            )
        }

        await prisma.report.create({
            data: {
                pinId: id,
                reporterId: user.id,
                reason,
                description: cleanDescription,
            },
        })

        return NextResponse.json(
            { message: 'گزارش شما ثبت شد. ممنون از همکاری‌تان' },
            { status: 201 }
        )
    } catch (error) {
        console.error('POST /api/pins/[id]/report error:', error)
        return NextResponse.json(
            { error: 'خطا در ثبت گزارش' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای بازگردانی وارد شوید' },
                { status: 401 }
            )
        }

        const deleted = await prisma.report.deleteMany({
            where: {
                pinId: id,
                reporterId: user.id,
            },
        })

        if (deleted.count === 0) {
            return NextResponse.json(
                { error: 'گزارشی از شما روی این پین پیدا نشد' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            message: 'گزارش حذف شد — پین دوباره نمایش داده می‌شود',
        })
    } catch (error) {
        console.error('DELETE /api/pins/[id]/report error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف گزارش' },
            { status: 500 }
        )
    }
}