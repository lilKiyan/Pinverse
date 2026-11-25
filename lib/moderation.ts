const BANNED_WORDS = [
    'کلمه_زشت_۱',
    'کلمه_زشت_۲',
]

const SPAM_PATTERNS = [
    /https?:\/\/[^\s]+/i,       
    /(?:\+98|0)?9\d{9}/,     
    /(.)\1{9,}/,            
    /\b(?:viagra|casino|crypto\s*airdrop)\b/i, 
]

export function moderateText(text: string, allowLinks = false): {
    ok: boolean
    reason?: string
} {
    const trimmed = text.trim()
    if (!trimmed) return { ok: true }

    const lower = trimmed.toLowerCase()
    for (const word of BANNED_WORDS) {
        if (lower.includes(word)) {
            return { ok: false, reason: 'محتوا شامل کلمات نامناسب است' }
        }
    }

    if (!allowLinks && SPAM_PATTERNS[0].test(trimmed)) {
        return { ok: false, reason: 'ارسال لینک در دیدگاه مجاز نیست' }
    }

    for (let i = 1; i < SPAM_PATTERNS.length; i++) {
        if (SPAM_PATTERNS[i].test(trimmed)) {
            return { ok: false, reason: 'محتوا شبیه اسپم است' }
        }
    }

    const caps = trimmed.replace(/[^A-Z]/g, '').length
    if (trimmed.length > 20 && caps / trimmed.length > 0.6) {
        return { ok: false, reason: 'لطفاً از حروف بزرگ انبوه استفاده نکنید' }
    }

    return { ok: true }
}