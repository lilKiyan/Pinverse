import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { moderateText } from '@/lib/moderation'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(request: Request) {
    try {
        const user = await getCurrentUser()

        const cacheControl = user ? 'private, no-store' : 'public, max-age=60, stale-while-revalidate=120'

        const { searchParams } = new URL(request.url)
        const page = Number(searchParams.get('page') || '1')
        const limit = Number(searchParams.get('limit') || '12')
        const skip = (page - 1) * limit

        const categorySlug = searchParams.get('category') || ''
        let categoryFilter = {}
        if (categorySlug) {
            const category = await prisma.category.findUnique({
                where: { slug: categorySlug },
                select: { id: true, isActive: true },
            })

            if (category?.isActive) {
                categoryFilter = { categoryId: category.id }
            }
        }


        const reportedFilter = user
            ? { reports: { none: { reporterId: user.id } } }
            : {}

        const [pins, totalCount] = await Promise.all([
            prisma.pin.findMany({
                where: {
                    AND: [reportedFilter, categoryFilter],
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    saves: {
                        include: { board: true },
                    },
                    category: {                       
                        select: { slug: true, name: true, icon: true, color: true },
                    },

                },
            }),
            prisma.pin.count({
                where: {
                    AND: [reportedFilter, categoryFilter],   
                },
            }),
        ])

        const pinsWithMeta = pins.map((pin) => {
            const userSaves = user
                ? pin.saves.filter((s) => s.userId === user.id)
                : []

            return {
                id: pin.id,
                title: pin.title,
                description: pin.description,
                imageUrl: pin.imageUrl,
                imageWidth: pin.imageWidth,
                imageHeight: pin.imageHeight,
                createdAt: pin.createdAt,
                updatedAt: pin.updatedAt,
                userId: pin.userId,
                isOwner: false,
                isSavedByMe: userSaves.length > 0,
                category: pin.category
                    ? {
                        slug: pin.category.slug,
                        name: pin.category.name,
                        icon: pin.category.icon,
                        color: pin.category.color,
                    }
                    : null,
                savedBoards: userSaves.map((s) => ({
                    boardId: s.boardId,
                    boardName: s.board?.name || null,
                })),
            }
        })

        const hasMore = skip + pins.length < totalCount

        return NextResponse.json({ pins: pinsWithMeta, hasMore },
            {
                headers: {
                    'Cache-Control': cacheControl,
                }
            }
        )

    } catch (error) {
        console.error('GET /api/pins error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌ها' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const rl = rateLimit(getClientIp(request), { limit: 15, windowMs: 600_000 })
        if (!rl.ok) {
            return NextResponse.json(
                { error: `سقف ساخت پین موقتاً پر شده. ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
            )
        }

        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ساخت پین باید وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { title, description, imageUrl, imageWidth, imageHeight, boardId, category } = body   // ✅ category اضافه

        if (!title || !imageUrl) {
            return NextResponse.json(
                { error: 'عنوان و تصویر الزامی است' },
                { status: 400 }
            )
        }

        const titleModeration = moderateText(title.trim())
        if (!titleModeration.ok) {
            return NextResponse.json({ error: `عنوان: ${titleModeration.reason}` }, { status: 400 })
        }

        const descriptionModeration = moderateText(description?.trim() || '')
        if (!descriptionModeration.ok) {
            return NextResponse.json({ error: `توضیحات: ${descriptionModeration.reason}` }, { status: 400 })
        }

        const requestedCategory = category || 'other'
        const categoryRecord = await prisma.category.findUnique({
            where: { slug: requestedCategory },
            select: { id: true, isActive: true },
        })

        const categoryId = categoryRecord?.isActive
            ? categoryRecord.id
            : (await prisma.category.findUnique({
                where: { slug: 'other' },
                select: { id: true },
            }))?.id ?? null

        const newPin = await prisma.pin.create({
            data: {
                title: title.trim(),
                description: description?.trim() || '',
                imageUrl,
                userId: user.id,
                imageWidth: imageWidth ?? null,
                imageHeight: imageHeight ?? null,
                boardId: boardId || null,
                categoryId,  
            },
        })

        return NextResponse.json(newPin, { status: 201 })
    } catch (error) {
        console.error('POST /api/pins error:', error)
        return NextResponse.json(
            { error: 'خطا در ساخت پین' },
            { status: 500 }
        )
    }
}