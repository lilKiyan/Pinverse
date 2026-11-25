import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin('users.edit')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const { id } = await params
        const body = await request.json()
        const { roleName } = body as { roleName?: string }

        if (!roleName || !['admin', 'moderator', 'user'].includes(roleName)) {
            return NextResponse.json(
                { error: 'نقش نامعتبر است. مقادیر مجاز: admin, moderator, user' },
                { status: 400 }
            )
        }

        if (id === admin.id && roleName !== 'admin') {
            return NextResponse.json(
                { error: 'نمی‌توانید نقش مدیریت را از حساب خود بردارید' },
                { status: 400 }
            )
        }

        const targetUser = await prisma.user.findUnique({
            where: { id },
            select: { id: true, name: true, username: true },
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 })
        }

        let roleRecord = await prisma.role.findUnique({
            where: { name: roleName },
        })

        if (!roleRecord && roleName !== 'user') {
            roleRecord = await prisma.role.create({
                data: {
                    name: roleName,
                    description: roleName === 'admin' ? 'دسترسی کامل مدیریت' : 'مدیر محتوا',
                },
            })
        }

        await prisma.$transaction(async (tx) => {
            await tx.userRole.deleteMany({
                where: { userId: id },
            })

            if (roleName !== 'user' && roleRecord) {
                await tx.userRole.create({
                    data: {
                        userId: id,
                        roleId: roleRecord.id,
                    },
                })
            }
        })

        const rolePersian = roleName === 'admin' ? 'مدیر ارشد' : roleName === 'moderator' ? 'ناظر محتوا' : 'کاربر عادی'

        return NextResponse.json({
            success: true,
            role: roleName,
            message: `نقش کاربر به «${rolePersian}» تغییر یافت`,
        })
    } catch (error) {
        console.error('POST /api/admin/users/[id]/role error:', error)
        return NextResponse.json({ error: 'خطا در تغییر نقش کاربر' }, { status: 500 })
    }
}
