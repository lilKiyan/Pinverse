import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ویرایش پین وارد شوید' },
                { status: 401 }
            )
        }

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { id: true, userId: true, title: true, description: true },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        if (pin.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مالک این پین نیستید' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const dataToUpdate: Record<string, unknown> = {}

        if (body.title !== undefined) {
            dataToUpdate.title = typeof body.title === 'string' ? body.title.trim() : pin.title
        }
        if (body.description !== undefined) {
            dataToUpdate.description = typeof body.description === 'string' ? body.description.trim() || null : null
        }
        if (body.category !== undefined) {
            if (!body.category) {
                dataToUpdate.categoryId = null
            } else {
                const cat = await prisma.category.findFirst({
                    where: {
                        OR: [
                            { slug: String(body.category).trim() },
                            { id: String(body.category).trim() },
                        ],
                        isActive: true,
                    },
                    select: { id: true },
                })
                if (cat) {
                    dataToUpdate.categoryId = cat.id
                }
            }
        }

        const updatedPin = await prisma.pin.update({
            where: { id },
            data: dataToUpdate,
            include: {
                category: {
                    select: { slug: true, name: true, icon: true, color: true },
                },
            },
        })

        return NextResponse.json({
            pin: updatedPin,
            message: 'پین با موفقیت به‌روزرسانی شد',
        })
    } catch (error) {
        console.error('PATCH /api/pins/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در ویرایش پین' },
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
                { error: 'برای حذف پین وارد شوید' },
                { status: 401 }
            )
        }

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { id: true, userId: true },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        if (pin.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مالک این پین نیستید' },
                { status: 403 }
            )
        }

        await prisma.$transaction(async (tx) => {
            // گزارش‌های این پین (ریشه P2003 — Report_pinId_fkey)
            await tx.report.deleteMany({
                where: { pinId: id },
            })

            // نوتیف‌های اشاره‌کننده به این پین
            await tx.notification.deleteMany({
                where: { pinId: id },
            })

            // پیام‌های چتی که این پین را حمل می‌کنند → detach (تاریخچه چت حفظ شود)
            await tx.message.updateMany({
                where: { pinId: id },
                data: { pinId: null },
            })

            // وابستگی‌های کلاسیک
            await tx.save.deleteMany({ where: { pinId: id } })
            await tx.like.deleteMany({ where: { pinId: id } })
            await tx.comment.deleteMany({ where: { pinId: id } })

            // خود پین
            await tx.pin.delete({ where: { id } })
        })

        return NextResponse.json({ message: 'پین حذف شد' })
    } catch (error) {
        console.error('DELETE /api/pins/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف پین' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const cacheControl = user
            ? 'private, no-store'
            : 'public, max-age=120, stale-while-revalidate=300'

        const pin = await prisma.pin.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        name: true,
                        avatar: true,
                    },
                },
                saves: {
                    include: {
                        board: true,
                    },
                },
                category: {                         
                    select: { slug: true, name: true, icon: true, color: true },
                },
                likes: true,
                comments: true,
            },
        })

        if (!pin) {
            return NextResponse.json(
                { error: 'پین یافت نشد' },
                { status: 404 }
            )
        }

        // اگر پین هنوز تایید نشده، فقط خود سازنده و مدیران اجازه مشاهده دارند
        if (pin.status !== 'APPROVED') {
            const isOwner = Boolean(user && user.id === pin.userId)
            let isAdmin = false
            if (user && !isOwner) {
                const userRoles = await prisma.userRole.findMany({
                    where: { userId: user.id },
                    include: { role: true },
                })
                isAdmin = userRoles.some(
                    (r) => r.role.name === 'admin' || r.role.name === 'moderator'
                )
            }

            if (!isOwner && !isAdmin) {
                return NextResponse.json(
                    {
                        error:
                            pin.status === 'REJECTED'
                                ? 'این پین توسط مدیر تایید نشده است'
                                : 'این پین در انتظار بررسی و تایید مدیر است',
                    },
                    { status: 403 }
                )
            }
        }

        const userSaves = user ? pin.saves.filter((s) => s.userId === user.id) : []

        const pinData = {
            id: pin.id,
            title: pin.title,
            description: pin.description,
            imageUrl: pin.imageUrl,
            link: pin.link,
            status: pin.status,
            rejectionReason: pin.rejectionReason,
            createdAt: pin.createdAt,
            updatedAt: pin.updatedAt,
            userId: pin.userId,
            owner: {
                id: pin.user.id,
                username: pin.user.username,
                name: pin.user.name,
                avatar: pin.user.avatar,
            },
            isOwner: user ? pin.userId === user.id : false,
            isSavedByMe: userSaves.length > 0,
            category: pin.category,
            savedBoards: userSaves.map((s) => ({
                boardId: s.boardId,
                boardName: s.board?.name || null,
            })),
            totalSaves: pin.saves.length,
            totalLikes: pin.likes.length,
            totalComments: pin.comments.length,
            isLikedByMe: user ? pin.likes.some((l) => l.userId === user.id) : false,
        }

        return NextResponse.json({ pin: pinData },
            {
                headers: {
                    'Cache-Control': cacheControl,
                },
            })
    } catch (error) {
        console.error('GET /api/pins/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت پین' },
            { status: 500 }
        )
    }
}