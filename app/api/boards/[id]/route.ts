import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        const board = await prisma.board.findUnique({
            where: { id },
            include: {
                saves: {
                    include: {
                        pin: {
                            include: {
                                _count: { select: { images: true } },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        })

        if (!board) {
            return NextResponse.json(
                { error: 'برد یافت نشد' },
                { status: 404 }
            )
        }

        if (board.isPrivate && board.userId !== user?.id) {
            return NextResponse.json(
                { error: 'به این برد دسترسی ندارید' },
                { status: 403 }
            )
        }

        const pins = board.saves.map((save) => ({
            id: save.pin.id,
            title: save.pin.title,
            imageWidth: save.pin.imageWidth,    
            imageHeight: save.pin.imageHeight,
            description: save.pin.description,
            imageUrl: save.pin.imageUrl,
            imagesCount: Math.max(1, save.pin._count.images),
            createdAt: save.pin.createdAt,
            updatedAt: save.pin.updatedAt,
            userId: save.pin.userId,
            isOwner: user ? save.pin.userId === user.id : false,
            isSavedByMe: true,
            savedBoards: [
                {
                    boardId: board.id,
                    boardName: board.name,
                },
            ],
        }))

        return NextResponse.json({ ...board, pins })
    } catch (error) {
        console.error('GET /api/boards/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در دریافت برد' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'برای ویرایش برد وارد شوید' },
                { status: 401 }
            )
        }

        const board = await prisma.board.findUnique({ where: { id } })

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

        const body = await request.json()
        const updatedBoard = await prisma.board.update({
            where: { id },
            data: {
                name: body.name ?? board.name,
                isPrivate: body.isPrivate ?? board.isPrivate,
            },
        })

        return NextResponse.json(updatedBoard)
    } catch (error) {
        console.error('PATCH /api/boards/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در ویرایش برد' },
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
                { error: 'برای حذف برد وارد شوید' },
                { status: 401 }
            )
        }

        const board = await prisma.board.findUnique({ where: { id } })

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

        await prisma.save.deleteMany({ where: { boardId: id } })

        await prisma.board.delete({ where: { id } })

        return NextResponse.json({ message: 'برد حذف شد' })
    } catch (error) {
        console.error('DELETE /api/boards/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف برد' },
            { status: 500 }
        )
    }
}