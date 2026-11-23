import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                },
            }
        )
    } catch (error) {
        console.error('GET /api/categories error:', error)
        return NextResponse.json({ error: 'خطا در دریافت دسته‌بندی‌ها' }, { status: 500 })
    }
} 