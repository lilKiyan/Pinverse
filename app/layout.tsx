import './globals.css'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import MobileNav from './components/MobileNav'
import Providers from './providers'
import type { Metadata, Viewport } from 'next'                         
import ServiceWorkerRegister from './components/ServiceWorkerRegister'     

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pinverse.ir'

export const metadata: Metadata = {
    metadataBase: new URL(siteUrl),
    title: {
        default: 'Pinverse — پلتفرم اشتراک‌گذاری تصویر',
        template: '%s | Pinverse',
    },
    description: 'پلتفرم اشتراک‌گذاری تصویر Pinverse — پین، برد، چت و اعلان زنده',
    keywords: [
        'PInverse',
        'پینورس',
        'اشتراک تصویر',
        'پینترست فارسی',
        'ایده‌های خلاقانه',
        'عکس',
        'گالری تصویر',
        'طراحی',
        'هنر',
        'پین',
    ],
    authors: [{ name: 'Pinverse' }],
    creator: 'Pinverse',
    publisher: 'Pinverse',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
        },
    },
    openGraph: {
        type: 'website',
        locale: 'fa_IR',
        url: '/',
        siteName: 'Pinverse',
        title: 'Pinverse — پلتفرم اشتراک‌گذاری تصویر',
        description: 'پلتفرم اشتراک‌گذاری تصویر Pinverse — پین، برد، چت و اعلان زنده',
        images: [
            {
                url: '/icons/icon-512.png',
                width: 512,
                height: 512,
                alt: 'Pinverse',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Pinverse — پلتفرم اشتراک‌گذاری تصویر',
        description: 'پلتفرم اشتراک‌گذاری تصویر Pinverse — پین، برد، چت و اعلان زنده',
        images: ['/icons/icon-512.png'],
    },
    alternates: {
        canonical: '/',
    },
    appleWebApp: {
        capable: true,
        title: 'Pinverse',
        statusBarStyle: 'default',
    },
    icons: {
        icon: '/icons/icon-192.png',
    },
}

export const viewport: Viewport = {
    themeColor: '#ffffff',
}

const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pinverse',
    alternateName: 'پینورس',
    url: siteUrl,
    potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="fa" dir="rtl">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
                />
            </head>
            <body className="bg-white selection:bg-rose-600 selection:text-white text-gray-900">
                <ServiceWorkerRegister />    
                <Providers>
                    <div className="flex h-dvh overflow-hidden">
                        <Sidebar />
                        <div className="flex-1 min-w-0 flex flex-col h-full">
                            <Navbar />
                            <main className="flex-1 min-h-0 overflow-y-auto">{children}</main>
                        </div>
                    </div>
                    <MobileNav />
                </Providers>
            </body>
        </html>
    )
}