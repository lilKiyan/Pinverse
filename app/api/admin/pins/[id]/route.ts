import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('pins.delete')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const { id } = await params

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { id: true, title: true },
        })

        if (!pin) {
            return NextResponse.json({ error: 'پین یافت نشد' }, { status: 404 })
        }

        await prisma.$transaction(async (tx) => {
            await tx.report.deleteMany({ where: { pinId: id } })
            await tx.notification.deleteMany({ where: { pinId: id } })
            await tx.message.updateMany({
                where: { pinId: id },
                data: { pinId: null },
            })
            await tx.save.deleteMany({ where: { pinId: id } })
            await tx.like.deleteMany({ where: { pinId: id } })
            await tx.comment.deleteMany({ where: { pinId: id } })
            await tx.pin.delete({ where: { id } })
        })

        return NextResponse.json({
            success: true,
            message: `پین «${pin.title}» توسط مدیر حذف شد`,
        })
    } catch (error) {
        console.error('DELETE /api/admin/pins/[id] error:', error)
        return NextResponse.json({ error: 'خطا در حذف پین' }, { status: 500 })
    }
}
