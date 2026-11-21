import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'

    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/pin/', '/category/', '/user/', '/board/'],
                disallow: [
                    '/api/',
                    '/admin/',
                    '/messages/',
                    '/settings/',
                    '/create/',
                    '/updates/',
                    '/login/',
                    '/register/',
                ],
            },
        ],
        sitemap: `${siteUrl}/sitemap.xml`,
    }
}
