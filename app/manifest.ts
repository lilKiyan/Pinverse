import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Pinverse — پلتفرم اشتراک‌گذاری تصویر',
        short_name: 'Pinverse',
        description: 'پلتفرم اشتراک‌گذاری تصویر Pinverse — پین، برد، چت و اعلان زنده',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        dir: 'rtl',
        lang: 'fa',
        icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
    }
}