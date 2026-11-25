import type { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const PERMISSIONS = [
    { key: 'reports.view', description: 'مشاهده لیست گزارش‌ها' },
    { key: 'reports.resolve', description: 'رسیدگی/بستن گزارش‌ها' },
    { key: 'pins.delete', description: 'حذف هر پین (مودریشن)' },
    { key: 'users.view', description: 'مشاهده لیست کاربران' },
    { key: 'users.ban', description: 'مسدود/آزادسازی کاربر' },
    { key: 'users.edit', description: 'ویرایش اطلاعات کاربران' },
    { key: 'users.delete', description: 'حذف کامل کاربر' },
    { key: 'stats.view', description: 'مشاهده آمار کلی' },
    { key: 'categories.manage', description: 'مدیریت دسته‌بندی‌ها' },
] as const

export const ROLES = [
    {
        name: 'admin',
        description: 'دسترسی کامل به پنل مدیریت',
        permissions: ['*'],
    },
    {
        name: 'moderator',
        description: 'مدیر محتوا — فقط مودریشن، بدون مدیریت کاربران',
        permissions: ['reports.view', 'reports.resolve', 'pins.delete'],
    },
    {
        name: 'user',
        description: 'کاربر عادی — بدون دسترسی مدیریتی',
        permissions: [],
    },
]

export const CATEGORIES_SEED = [
    { slug: 'art', name: 'هنر و طراحی', icon: 'art', color: '#8b5cf6', sortOrder: 1 },
    { slug: 'cooking', name: 'آشپزی', icon: 'cooking', color: '#f59e0b', sortOrder: 2 },
    { slug: 'travel', name: 'سفر و مکان‌ها', icon: 'travel', color: '#0ea5e9', sortOrder: 3 },
    { slug: 'technology', name: 'تکنولوژی', icon: 'technology', color: '#3b82f6', sortOrder: 4 },
    { slug: 'fashion', name: 'مد و استایل', icon: 'fashion', color: '#ec4899', sortOrder: 5 },
    { slug: 'sports', name: 'ورزش و تناسب', icon: 'sports', color: '#22c55e', sortOrder: 6 },
    { slug: 'home', name: 'خانه و دکور', icon: 'home', color: '#a855f7', sortOrder: 7 },
    { slug: 'garden', name: 'گیاهان و باغبانی', icon: 'garden', color: '#10b981', sortOrder: 8 },
    { slug: 'photography', name: 'عکاسی', icon: 'photography', color: '#64748b', sortOrder: 9 },
    { slug: 'ideas', name: 'ایده‌های خلاقانه', icon: 'ideas', color: '#eab308', sortOrder: 10 },
    { slug: 'music', name: 'موسیقی', icon: 'music', color: '#f43f5e', sortOrder: 11 },
    { slug: 'other', name: 'سایر', icon: 'other', color: '#9ca3af', sortOrder: 99 },
]

export async function seedDatabase(prisma: PrismaClient, options?: { log?: boolean }) {
    const log = options?.log ?? false

    if (log) console.log('🌱 Seeding RBAC system...')

    const permissionMap = new Map<string, string>()
    for (const perm of PERMISSIONS) {
        const record = await prisma.permission.upsert({
            where: { key: perm.key },
            update: { description: perm.description },
            create: { key: perm.key, description: perm.description },
        })
        permissionMap.set(perm.key, record.id)
        if (log) console.log(`  ✅ permission: ${perm.key}`)
    }

    let adminRoleId: string | null = null
    let userRoleId: string | null = null

    for (const role of ROLES) {
        const roleRecord = await prisma.role.upsert({
            where: { name: role.name },
            update: { description: role.description },
            create: { name: role.name, description: role.description },
        })

        if (role.name === 'admin') adminRoleId = roleRecord.id
        if (role.name === 'user') userRoleId = roleRecord.id

        await prisma.rolePermission.deleteMany({
            where: { roleId: roleRecord.id },
        })

        const keys =
            role.permissions[0] === '*' ? PERMISSIONS.map((p) => p.key) : role.permissions

        for (const key of keys) {
            const permissionId = permissionMap.get(key)
            if (permissionId) {
                await prisma.rolePermission.create({
                    data: {
                        roleId: roleRecord.id,
                        permissionId,
                    },
                })
            }
        }

        if (log) console.log(`  ✅ role: ${role.name} (${keys.length} permissions)`)
    }

    if (userRoleId) {
        const orphans = await prisma.user.findMany({
            where: { roles: { none: {} } },
            select: { id: true },
        })

        for (const orphan of orphans) {
            await prisma.userRole.create({
                data: { userId: orphan.id, roleId: userRoleId },
            })
        }

        if (log && orphans.length > 0) {
            console.log(`  ✅ ${orphans.length} کاربر بدون نقش → به نقش "user" وصل شد`)
        }
    }

    for (const cat of CATEGORIES_SEED) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                icon: cat.icon,
                color: cat.color,
                sortOrder: cat.sortOrder,
            },
            create: cat,
        })
        if (log) console.log(`  ✅ category: ${cat.name}`)
    }

    if (adminRoleId) {
        const existingAdminCount = await prisma.userRole.count({
            where: { roleId: adminRoleId },
        })

        if (existingAdminCount === 0) {
            const existingAdminUser = await prisma.user.findFirst({
                where: {
                    OR: [{ username: 'admin' }, { email: 'admin@pinverse.ir' }],
                },
                select: { id: true },
            })

            if (existingAdminUser) {
                await prisma.userRole.upsert({
                    where: {
                        userId_roleId: {
                            userId: existingAdminUser.id,
                            roleId: adminRoleId,
                        },
                    },
                    update: {},
                    create: {
                        userId: existingAdminUser.id,
                        roleId: adminRoleId,
                    },
                })
                if (log) console.log('  ✅ default admin role assigned to existing admin user')
            } else {
                const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin'
                const hashedPassword = await bcrypt.hash(defaultPassword, 10)

                const newAdmin = await prisma.user.create({
                    data: {
                        username: 'admin',
                        email: 'admin@pinverse.ir',
                        name: 'مدیر سیستم',
                        password: hashedPassword,
                        bio: 'حساب مدیر پیش‌فرض سیستم (لطفاً پس از ورود رمز عبور را تغییر دهید)',
                    },
                })

                await prisma.userRole.create({
                    data: {
                        userId: newAdmin.id,
                        roleId: adminRoleId,
                    },
                })

                if (log) {
                    console.log(
                        `  👑 default admin created -> username: "admin" | email: "admin@pinverse.ir" | password: "${defaultPassword}"`
                    )
                }
            }
        }
    }

    if (log) console.log('🌱 Seeding complete!')
}
