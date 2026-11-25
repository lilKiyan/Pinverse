import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { moderateText } from '@/lib/moderation'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

const MAX_PIN_IMAGES = 6
const ALLOWED_IMAGE_HOSTNAMES = ['res.cloudinary.com', 'images.unsplash.com']

function isAllowedImageUrl(rawUrl: string): boolean {
    try {
        const parsedUrl = new URL(rawUrl)
        return (
            parsedUrl.protocol === 'https:' &&
            ALLOWED_IMAGE_HOSTNAMES.some(
                (h) => parsedUrl.hostname === h || parsedUrl.hostname.endsWith(`.${h}`)
            )
        )
    } catch {
        return false
    }
}

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

        const rawPins = await prisma.pin.findMany({
            where: {
                AND: [reportedFilter, categoryFilter, { status: 'APPROVED' }],
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit + 1,
            include: {
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
                _count: {
                    select: { images: true },
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
                imagesCount: Math.max(1, pin._count.images),
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
        const { title, description, imageUrl, imageWidth, imageHeight, boardId, category, images } = body

        type IncomingImage = {
            imageUrl: string
            width?: number | null
            height?: number | null
        }

        let normalizedImages: {
            imageUrl: string
            width: number | null
            height: number | null
            sortOrder: number
        }[] = []

        if (Array.isArray(images) && images.length > 0) {
            if (images.length > MAX_PIN_IMAGES) {
                return NextResponse.json(
                    { error: `حداکثر ${MAX_PIN_IMAGES} تصویر برای هر پین مجاز است` },
                    { status: 400 }
                )
            }

            for (let i = 0; i < images.length; i++) {
                const item = images[i] as IncomingImage
                if (!item || typeof item.imageUrl !== 'string' || !isAllowedImageUrl(item.imageUrl)) {
                    return NextResponse.json(
                        { error: 'آدرس یکی از تصاویر نامعتبر است. تصاویر باید از دامنه‌های معتبر بارگذاری شوند.' },
                        { status: 400 }
                    )
                }
                normalizedImages.push({
                    imageUrl: item.imageUrl,
                    width: typeof item.width === 'number' && Number.isFinite(item.width) ? Math.round(item.width) : null,
                    height: typeof item.height === 'number' && Number.isFinite(item.height) ? Math.round(item.height) : null,
                    sortOrder: i,
                })
            }
        } else if (imageUrl && typeof imageUrl === 'string') {
            if (!isAllowedImageUrl(imageUrl)) {
                return NextResponse.json(
                    { error: 'آدرس تصویر نامعتبر است. تصویر باید از دامنه‌های معتبر بارگذاری شود.' },
                    { status: 400 }
                )
            }
            normalizedImages = [
                {
                    imageUrl,
                    width: typeof imageWidth === 'number' && Number.isFinite(imageWidth) ? Math.round(imageWidth) : null,
                    height: typeof imageHeight === 'number' && Number.isFinite(imageHeight) ? Math.round(imageHeight) : null,
                    sortOrder: 0,
                },
            ]
        }

        if (!title || typeof title !== 'string' || !title.trim() || normalizedImages.length === 0) {
            return NextResponse.json(
                { error: 'عنوان و حداقل یک تصویر الزامی است' },
                { status: 400 }
            )
        }

        const coverImage = normalizedImages[0]

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
                imageUrl: coverImage.imageUrl,
                userId: user.id,
                imageWidth: coverImage.width,
                imageHeight: coverImage.height,
                boardId: boardId || null,
                categoryId,
                status: initialStatus,
                images: {
                    create: normalizedImages,
                },
            },
            include: {
                images: {
                    orderBy: { sortOrder: 'asc' },
                },
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