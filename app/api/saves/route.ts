import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { createNotification } from '@/lib/notifications'
import { rateLimit, getClientIp } from '@/lib/rateLimit'

export async function POST(request: Request) {
    try {
        const rl = rateLimit(getClientIp(request), { limit: 30, windowMs: 60_000 })
        if (!rl.ok) {
            return NextResponse.json(
                { error: `کمی آرام‌تر! ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
                { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
            )
        }

        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ذخیره پین وارد شوید' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { pinId, boardId } = body

        if (!pinId || !boardId) {
            return NextResponse.json(
                { error: 'شناسه پین و برد الزامی است' },
                { status: 400 }
            )
        }

        const board = await prisma.board.findUnique({
            where: { id: boardId },
        })

        if (!board) {
            return NextResponse.json(
                { error: 'برد یافت نشد' },
                { status: 404 }
            )
        }

        if (board.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مالک این برد نیستید' },
                { status: 403 }
            )
        }

        const existingSave = await prisma.save.findFirst({
            where: {
                userId: user.id,
                pinId,
                boardId,
            },
        })

        if (existingSave) {
            return NextResponse.json(
                { error: 'این پین قبلاً در این برد ذخیره شده است' },
                { status: 409 }
            )
        }

        const newSave = await prisma.save.create({
            data: {
                userId: user.id,
                pinId,
                boardId,
            },
        })

        const targetPin = await prisma.pin.findUnique({
            where: { id: pinId },
            select: { userId: true, title: true },
        })

        if (targetPin) {
            await createNotification({
                type: 'save',
                recipientId: targetPin.userId,
                actorId: user.id,
                pinId: pinId,
                pinTitle: targetPin.title,
            })
        }

        return NextResponse.json(newSave, { status: 201 })
    } catch (error) {
        console.error('POST /api/saves error:', error)
        return NextResponse.json(
            { error: 'خطا در ذخیره پین' },
            { status: 500 }
        )
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای مشاهده پین‌های ذخیره‌شده وارد شوید' },
                { status: 401 }
            )
        }

        const saves = await prisma.save.findMany({
            where: { userId: user.id },
            include: {
                board: true,
                pin: {
                    include: {
                        category: {
                            select: { slug: true, name: true, icon: true, color: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        const pinMap = new Map<string, any>()

        saves.forEach((save) => {
            const pinId = save.pinId
            if (!pinMap.has(pinId)) {
                pinMap.set(pinId, {
                    id: save.pin.id,
                    title: save.pin.title,
                    description: save.pin.description,
                    imageUrl: save.pin.imageUrl,
                    imageWidth: save.pin.imageWidth,
                    imageHeight: save.pin.imageHeight,
                    createdAt: save.pin.createdAt,
                    updatedAt: save.pin.updatedAt,
                    userId: save.pin.userId,
                    isOwner: save.pin.userId === user.id,
                    category: save.pin.category
                        ? {
                            slug: save.pin.category.slug,
                            name: save.pin.category.name,
                            icon: save.pin.category.icon,
                            color: save.pin.category.color,
                        }
                        : null,
                    isSavedByMe: true,
                    savedBoards: [],
                })
            }
            pinMap.get(pinId).savedBoards.push({
                boardId: save.boardId,
                boardName: save.board?.name || null,
            })
        })

        const pins = Array.from(pinMap.values())

        return NextResponse.json(pins)
    } catch (error) {
        console.error('GET /api/saves error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین‌های ذخیره‌شده' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ذخیره وارد شوید' },
                { status: 401 },
            )
        }

        const body = await request.json()
        const { pinId, boardId } = body

        if (!pinId || !boardId) {
            return NextResponse.json(
                { error: 'شناسه پین و برد الزامی است' },
                { status: 400 }
            )
        }

        const existingSave = await prisma.save.findFirst({
            where: {
                userId: user.id,
                pinId,
                boardId,
            },
        })

        if (!existingSave) {
            return NextResponse.json(
                { error: 'این پین در این برد ذخیره نشده است' },
                { status: 404 }
            )
        }

        await prisma.save.delete({
            where: { id: existingSave.id },
        })

        return NextResponse.json({ success: true, message: 'ذخیره حذف شد' })
    } catch (error) {
        console.error('DELETE /api/saves error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف ذخیره' },
            { status: 500 }
        )
    }
}