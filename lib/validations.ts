export const RULES = {
    NAME: { min: 2, max: 50 },
    USERNAME: { min: 3, max: 20 },
    PASSWORD: { min: 8, max: 100 },
    EMAIL_MAX: 254,
}

export function validateEmail(email: string): string | null {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return 'ایمیل الزامی است'
    if (trimmed.length > RULES.EMAIL_MAX) return 'ایمیل بیش از حد طولانی است'

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!emailRegex.test(trimmed)) return 'فرمت ایمیل نامعتبر است'

    const domain = trimmed.split('@')[1]
    if (domain.length < 3 || !domain.includes('.')) return 'ایمیل نامعتبر است'

    return null
}

export function validateUsername(username: string): string | null {
    const trimmed = username.trim()
    if (!trimmed) return 'نام کاربری الزامی است'
    if (trimmed.length < RULES.USERNAME.min)
        return `نام کاربری باید حداقل ${RULES.USERNAME.min} کاراکتر باشد`
    if (trimmed.length > RULES.USERNAME.max)
        return `نام کاربری باید حداکثر ${RULES.USERNAME.max} کاراکتر باشد`

    const usernameRegex = /^[a-z0-9_]+$/
    if (!usernameRegex.test(trimmed))
        return 'نام کاربری فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و _ باشد'

    if (/^[0-9]/.test(trimmed))
        return 'نام کاربری نمی‌تواند با عدد شروع شود'

    const reserved = ['admin', 'api', 'login', 'register', 'user', 'root', 'system', 'support', 'help']
    if (reserved.includes(trimmed.toLowerCase()))
        return 'این نام کاربری قابل استفاده نیست'

    return null
}

export function validateName(name: string): string | null {
    const trimmed = name.trim()
    if (!trimmed) return 'نام الزامی است'
    if (trimmed.length < RULES.NAME.min)
        return `نام باید حداقل ${RULES.NAME.min} کاراکتر باشد`
    if (trimmed.length > RULES.NAME.max)
        return `نام باید حداکثر ${RULES.NAME.max} کاراکتر باشد`
    return null
}

export function validatePassword(password: string): string | null {
    if (!password) return 'رمز عبور الزامی است'
    if (password.length < RULES.PASSWORD.min)
        return `رمز عبور باید حداقل ${RULES.PASSWORD.min} کاراکتر باشد`
    if (password.length > RULES.PASSWORD.max)
        return 'رمز عبور بیش از حد طولانی است'

    if (!/[A-Z]/.test(password)) return 'رمز عبور باید شامل حداقل یک حرف بزرگ باشد'
    if (!/[a-z]/.test(password)) return 'رمز عبور باید شامل حداقل یک حرف کوچک باشد'
    if (!/[0-9]/.test(password)) return 'رمز عبور باید شامل حداقل یک عدد باشد'
    if (!/[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/.test(password))
        return 'رمز عبور باید شامل حداقل یک علامت خاص (!@#$%...) باشد'

    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'password1']
    if (commonPasswords.includes(password.toLowerCase()))
        return 'این رمز عبور بسیار رایج است، لطفاً رمز دیگری انتخاب کنید'

    return null
}

export function getPasswordStrength(password: string): {
    score: number
    label: string
    color: string
    barColor: string
} {
    if (!password) return { score: 0, label: '', color: '', barColor: '' }

    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[!@#$%^&*()_\-+=\[\]{};:'"\\|,.<>\/?]/.test(password)) score++

    const normalized = Math.min(4, Math.floor(score * 4 / 5))

    const map = {
        0: { label: '', color: '', barColor: '' },
        1: { label: 'خیلی ضعیف', color: 'text-red-500', barColor: 'bg-red-500' },
        2: { label: 'ضعیف', color: 'text-orange-500', barColor: 'bg-orange-500' },
        3: { label: 'خوب', color: 'text-yellow-500', barColor: 'bg-yellow-500' },
        4: { label: 'عالی', color: 'text-green-500', barColor: 'bg-green-500' },
    }

    return { score: normalized, ...map[normalized as keyof typeof map] }
}

export function normalizeUsername(username: string): string {
    return username.trim().toLowerCase()
}

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase()
}

export const CONTENT_LIMITS = {
    COMMENT: 500,
    MESSAGE: 2000,
}

export function validateCommentLength(text: string): string | null {
    if (!text || !text.trim()) return 'متن کامنت الزامی است'
    if (text.length > CONTENT_LIMITS.COMMENT) {
        return `کامنت نمی‌تواند بیش از ${CONTENT_LIMITS.COMMENT} کاراکتر باشد`
    }
    return null
}

export function validateMessageLength(text: string): string | null {
    if (!text || !text.trim()) return 'متن پیام الزامی است'
    if (text.length > CONTENT_LIMITS.MESSAGE) {
        return `پیام نمی‌تواند بیش از ${CONTENT_LIMITS.MESSAGE} کاراکتر باشد`
    }
    return null
}