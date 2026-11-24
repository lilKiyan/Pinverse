import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('pins.delete')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { status, reason } = body

        if (!status || !['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return NextResponse.json(
                { error: 'وضعیت ارسال شده نامعتبر است' },
                { status: 400 }
            )
        }

        const pin = await prisma.pin.findUnique({
            where: { id },
            select: { id: true, title: true, userId: true, status: true },
        })

        if (!pin) {
            return NextResponse.json({ error: 'پین یافت نشد' }, { status: 404 })
        }

        const rejectionReason = status === 'REJECTED'
            ? (typeof reason === 'string' && reason.trim() ? reason.trim() : 'عدم تطابق با قوانین پلتفرم')
            : null

        const updatedPin = await prisma.pin.update({
            where: { id },
            data: {
                status,
                rejectionReason,
            },
        })

        // ارسال اعلان به سازنده پین
        try {
            if (status === 'APPROVED' && pin.status !== 'APPROVED') {
                await prisma.notification.create({
                    data: {
                        userId: pin.userId,
                        actorId: admin.id,
                        pinId: pin.id,
                        type: 'pin_approved',
                        message: `پین شما با عنوان «${pin.title}» تایید و برای عموم کاربران منتشر شد 🎉`,
                    },
                })
            } else if (status === 'REJECTED' && pin.status !== 'REJECTED') {
                await prisma.notification.create({
                    data: {
                        userId: pin.userId,
                        actorId: admin.id,
                        pinId: pin.id,
                        type: 'pin_rejected',
                        message: `پین شما با عنوان «${pin.title}» تایید نشد: ${rejectionReason}`,
                    },
                })
            }
        } catch (notifErr) {
            console.error('Failed to create notification for pin status change:', notifErr)
        }

        const statusMessage =
            status === 'APPROVED'
                ? `پین «${pin.title}» با موفقیت تایید و منتشر شد`
                : status === 'REJECTED'
                ? `پین «${pin.title}» رد شد`
                : `پین «${pin.title}» به حالت در انتظار بررسی تغییر یافت`

        return NextResponse.json({
            success: true,
            pin: updatedPin,
            message: statusMessage,
        })
    } catch (error) {
        console.error('PATCH /api/admin/pins/[id] error:', error)
        return NextResponse.json({ error: 'خطا در تغییر وضعیت پین' }, { status: 500 })
    }
}

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
