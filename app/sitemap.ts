import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { CATEGORIES } from '@/lib/categories'

export const revalidate = 3600 // بازتولید خودکار نقشه سایت هر ۱ ساعت

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'

    // ۱. صفحات ثابت و کلیدی
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 1.0,
        },
        {
            url: `${siteUrl}/categories`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
    ]

    // ۲. صفحات دسته‌بندی‌ها
    const categoryRoutes: MetadataRoute.Sitemap = CATEGORIES.map((cat) => ({
        url: `${siteUrl}/category/${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.85,
    }))

    // ۳. صفحات پویا از دیتابیس (پین‌ها و کاربران)
    let pinRoutes: MetadataRoute.Sitemap = []
    let userRoutes: MetadataRoute.Sitemap = []

    try {
        const [pins, users] = await Promise.all([
            prisma.pin.findMany({
                select: {
                    id: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: 1000,
            }),
            prisma.user.findMany({
                select: {
                    id: true,
                },
                take: 500,
            }),
        ])

        pinRoutes = pins.map((pin) => ({
            url: `${siteUrl}/pin/${pin.id}`,
            lastModified: pin.createdAt,
            changeFrequency: 'weekly',
            priority: 0.7,
        }))

        userRoutes = users.map((user) => ({
            url: `${siteUrl}/user/${user.id}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        }))
    } catch (error) {
        console.error('خطا در بارگذاری اطلاعات نقشه سایت:', error)
    }

    return [...staticRoutes, ...categoryRoutes, ...pinRoutes, ...userRoutes]
}
