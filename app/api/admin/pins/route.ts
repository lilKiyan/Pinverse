import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET(request: Request) {
    try {
        const admin = await requireAdmin('reports.view')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const q = searchParams.get('q')?.trim() || ''
        const categorySlug = searchParams.get('category')?.trim() || ''
        const page = Math.max(1, Number(searchParams.get('page')) || 1)
        const limit = Math.min(50, Math.max(10, Number(searchParams.get('limit')) || 20))
        const skip = (page - 1) * limit

        const where: any = {}

        if (q) {
            where.OR = [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { user: { name: { contains: q, mode: 'insensitive' } } },
                { user: { username: { contains: q, mode: 'insensitive' } } },
            ]
        }

        if (categorySlug && categorySlug !== 'all') {
            where.category = { slug: categorySlug }
        }

        const [total, pins] = await Promise.all([
            prisma.pin.count({ where }),
            prisma.pin.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            username: true,
                            avatar: true,
                        },
                    },
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            color: true,
                            icon: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            saves: true,
                            comments: true,
                            reports: true,
                        },
                    },
                },
            }),
        ])

        return NextResponse.json({
            pins,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        })
    } catch (error) {
        console.error('GET /api/admin/pins error:', error)
        return NextResponse.json({ error: 'خطا در دریافت لیست پین‌ها' }, { status: 500 })
    }
}
