import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: {
                id: true,
                slug: true,
                name: true,
                 icon: true,
                color: true,
                _count: {
                    select: { pins: true }
                },
            },
        })

        return NextResponse.json(
            { categories },
            {
                headers: {
                    'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
                },
            }
        )
    } catch (error) {
        console.error('GET /api/categories error:', error)
        return NextResponse.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 })
    }
} 