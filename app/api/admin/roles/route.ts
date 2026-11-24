import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/adminAuth'

export async function GET() {
    try {
        const admin = await requireAdmin('users.view')
        if (!admin) {
            return NextResponse.json({ error: 'دسترسی ندارید' }, { status: 403 })
        }

        const roles = await prisma.role.findMany({
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: {
                    select: { users: true },
                },
            },
        })

        const totalUsers = await prisma.user.count()
        const assignedRoleUsersCount = roles.reduce((sum, r) => sum + r._count.users, 0)
        const regularUsersCount = Math.max(0, totalUsers - assignedRoleUsersCount)

        return NextResponse.json({
            roles: roles.map((r) => ({
                id: r.id,
                name: r.name,
                description: r.description,
                usersCount: r._count.users,
                permissions: r.permissions.map((p) => ({
                    key: p.permission.key,
                    description: p.permission.description,
                })),
            })),
            regularUsersCount,
            totalUsers,
        })
    } catch (error) {
        console.error('GET /api/admin/roles error:', error)
        return NextResponse.json({ error: 'خطا در دریافت نقش‌ها' }, { status: 500 })
    }
}
