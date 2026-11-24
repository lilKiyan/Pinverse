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

        // دریافت یک پین بیشتر (limit + 1) تا بدون نیاز به count متوجه وجود صفحه بعد بشویم
        // فقط پین‌های تایید شده (APPROVED) در فید عمومی نمایش داده می‌شوند
        const rawPins = await prisma.pin.findMany({
            where: {
                AND: [reportedFilter, categoryFilter, { status: 'APPROVED' }],
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit + 1,
            include: {
                // فقط سیوهای خود این کاربر گرفته می‌شود نه همه سیوهای دیتابیس
                saves: {
                    where: user ? { userId: user.id } : { userId: '__NONE__' },
                    include: {
                        board: {
                            select: { id: true, name: true },
                        },
                    },
                },
                category: {                       
                    select: { slug: true, name: true, icon: true, color: true },
                },
            },
        })

        const hasMore = rawPins.length > limit
        const pins = hasMore ? rawPins.slice(0, limit) : rawPins

        const pinsWithMeta = pins.map((pin) => {
            const userSaves = user ? pin.saves : []

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

        if (!title || !imageUrl || typeof imageUrl !== 'string') {
            return NextResponse.json(
                { error: 'عنوان و تصویر الزامی است' },
                { status: 400 }
            )
        }

        // بررسی اعتبار امنیتی آدرس تصویر
        try {
            const parsedUrl = new URL(imageUrl)
            const allowedHostnames = ['res.cloudinary.com', 'images.unsplash.com']
            if (parsedUrl.protocol !== 'https:' || !allowedHostnames.some((h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`))) {
                return NextResponse.json(
                    { error: 'آدرس تصویر نامعتبر است. تصویر باید از دامنه‌های معتبر بارگذاری شود.' },
                    { status: 400 }
                )
            }
        } catch {
            return NextResponse.json(
                { error: 'فرمت آدرس تصویر نامعتبر است' },
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

        // بررسی نقش کاربر: آیا مدیر یا ناظر است؟ پین مدیران مستقیماً منتشر می‌شود، بقیه در انتظار تایید قرار می‌گیرند
        const userRoles = await prisma.userRole.findMany({
            where: { userId: user.id },
            include: { role: true },
        })
        const isAdminOrMod = userRoles.some(
            (r) => r.role.name === 'admin' || r.role.name === 'moderator'
        )
        const initialStatus = isAdminOrMod ? 'APPROVED' : 'PENDING'

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
                status: initialStatus,
            },
        })

        return NextResponse.json({
            ...newPin,
            message:
                initialStatus === 'PENDING'
                    ? 'پین شما با موفقیت ثبت شد و پس از بررسی و تایید توسط مدیران، منتشر خواهد شد.'
                    : 'پین شما با موفقیت منتشر شد.',
        }, { status: 201 })
    } catch (error) {
        console.error('POST /api/pins error:', error)
        return NextResponse.json(
            { error: 'خطا در ساخت پین' },
            { status: 500 }
        )
    }
}