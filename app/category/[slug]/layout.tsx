import type { Metadata } from 'next'
import { getCategoryBySlug } from '@/lib/categories'

type Props = {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const category = getCategoryBySlug(slug)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'

    if (!category) {
        return {
            title: 'دسته‌بندی',
        }
    }

    const title = `ایده‌ها و عکس‌های دسته‌بندی ${category.name}`
    const description = `مجموعه‌ای از بهترین تصاویر، پین‌ها و ایده‌های خلاقانه در دسته ${category.name} را در PInverse تماشا و ذخیره کنید.`

    return {
        title,
        description,
        alternates: {
            canonical: `${siteUrl}/category/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `${siteUrl}/category/${slug}`,
            siteName: 'PInverse',
            type: 'website',
        },
        twitter: {
            card: 'summary',
            title,
            description,
        },
    }
}

export default async function CategoryLayout({ children, params }: Props) {
    const { slug } = await params
    const category = getCategoryBySlug(slug)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'

    const breadcrumbSchema = category
        ? {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                  {
                      '@type': 'ListItem',
                      position: 1,
                      name: 'خانه',
                      item: siteUrl,
                  },
                  {
                      '@type': 'ListItem',
                      position: 2,
                      name: 'دسته‌بندی‌ها',
                      item: `${siteUrl}/categories`,
                  },
                  {
                      '@type': 'ListItem',
                      position: 3,
                      name: category.name,
                      item: `${siteUrl}/category/${slug}`,
                  },
              ],
          }
        : null

    return (
        <>
            {breadcrumbSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
                />
            )}
            {children}
        </>
    )
}
