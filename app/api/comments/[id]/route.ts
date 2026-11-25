import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {

        const user = await getCurrentUser()
        if (!user) {
            return NextResponse.json(
                { error: 'برای حذف کامنت وارد شوید' },
                { status: 401 }
            )
        }

        const { id } = await params

        const comment = await prisma.comment.findUnique({
            where: { id },
            include: { pin: true },
        })

        if (!comment) {
            return NextResponse.json(
                { error: 'کامنت یافت نشد' },
                { status: 404 }
            )
        }

        if (comment.userId !== user.id && comment.pin.userId !== user.id) {
            return NextResponse.json(
                { error: 'شما مجاز به حذف این کامنت نیستید' },
                { status: 403 }
            )
        }

        await prisma.comment.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/comments/[id] error:', error)
        return NextResponse.json(
            { error: 'خطا در حذف کامنت' },
            { status: 500 }
        )
    }
}