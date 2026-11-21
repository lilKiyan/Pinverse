"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    FiUserPlus, FiUser, FiAtSign, FiMail, FiLock,
    FiEye, FiEyeOff, FiAlertCircle, FiArrowLeft, FiLoader,
} from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'
import {
    validateEmail, validateUsername, validateName, validatePassword,
    getPasswordStrength,
} from '@/lib/validations'

type FieldErrors = {
    name?: string
    username?: string
    email?: string
    password?: string
}

export default function RegisterPage() {
    const [name, setName] = useState('')
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
    const [serverError, setServerError] = useState('')
    const [loading, setLoading] = useState(false)

    const router = useRouter()
    const setUser = useAuthStore((state) => state.setUser)

    const strength = getPasswordStrength(password)

    // اعتبارسنجی تکی هر فیلد (موقع blur)
    const validateField = (field: keyof FieldErrors, value: string) => {
        let error: string | null = null
        if (field === 'name') error = validateName(value)
        if (field === 'username') error = validateUsername(value)
        if (field === 'email') error = validateEmail(value)
        if (field === 'password') error = validatePassword(value)

        setFieldErrors((prev) => ({ ...prev, [field]: error || undefined }))
        return !error
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setServerError('')

        // چک همه فیلدها
        const nameOk = validateField('name', name)
        const usernameOk = validateField('username', username)
        const emailOk = validateField('email', email)
        const passwordOk = validateField('password', password)

        if (!nameOk || !usernameOk || !emailOk || !passwordOk) return

        setLoading(true)
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, email, password }),
            })

            const data = await res.json()
            if (!res.ok) {
                if (data.field) {
                    setFieldErrors((prev) => ({ ...prev, [data.field]: data.error }))
                } else {
                    setServerError(data.error || 'خطا در ثبت‌نام')
                }
                return
            }

            if (data.user) setUser(data.user)
            router.push('/')
            router.refresh()
        } catch (err) {
            setServerError('خطای شبکه. لطفاً دوباره تلاش کنید')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main
            dir="rtl"
            className="relative h-full w-full flex items-center justify-center p-3 sm:p-4 md:p-5 lg:p-6 overflow-hidden bg-[#fff9f8] selection:bg-rose-500 selection:text-white"
        >
            {/* لایه پس‌زمینه ثابت برای جلوگیری از اسکرول افقی و حفظ اسکرول روان عمودی */}
            <div
                aria-hidden="true"
                className="fixed inset-0 overflow-hidden pointer-events-none"
            >
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(225, 29, 72, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(225, 29, 72, 0.06) 1px, transparent 1px)',
                        backgroundSize: '44px 44px',
                    }}
                />
                <div className="absolute -top-24 right-[-10%] sm:right-[10%] w-72 h-72 sm:w-[26rem] sm:h-[26rem] lg:w-[30rem] lg:h-[30rem] bg-rose-300/35 rounded-full blur-[90px] sm:blur-[110px]" />
                <div className="absolute -bottom-24 left-[-10%] sm:left-[8%] w-72 h-72 sm:w-[26rem] sm:h-[26rem] lg:w-[32rem] lg:h-[32rem] bg-orange-200/45 rounded-full blur-[90px] sm:blur-[120px]" />
            </div>

            {/* قاب بیرونی شیشه‌ای دو‌لایه (Double-Bezel) */}
            <div className="relative z-10 w-full max-w-[420px] sm:max-w-[480px] md:max-w-[760px] lg:max-w-[880px] p-1.5 sm:p-2 rounded-[24px] sm:rounded-[30px] bg-white/65 backdrop-blur-2xl shadow-[0_20px_60px_-18px_rgba(190,18,60,0.2)] lg:shadow-[0_28px_80px_-22px_rgba(190,18,60,0.22)] ring-1 ring-rose-950/[0.06]">
                <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden ring-1 ring-slate-100">

                    {/* پنل هنری و هدر برند */}
                    <div className="relative md:col-span-5 flex flex-col justify-between p-4 sm:p-5 md:p-6 lg:p-7 text-white overflow-hidden bg-gradient-to-br from-rose-500 via-red-600 to-rose-950">
                        <div className="absolute -top-16 -left-16 w-48 h-48 sm:w-64 sm:h-64 bg-orange-400/35 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-20 -right-14 w-56 h-56 sm:w-72 sm:h-72 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />

                        <div className="hidden sm:block absolute -bottom-28 -left-20 w-72 h-72 rounded-full border border-white/15 pointer-events-none" />
                        <div className="hidden sm:block absolute -bottom-20 -left-12 w-52 h-52 rounded-full border border-white/10 pointer-events-none" />

                        <span
                            aria-hidden="true"
                            className="absolute -bottom-6 -left-2 sm:-bottom-8 sm:-left-3 md:-bottom-10 md:-left-4 text-[115px] sm:text-[150px] md:text-[190px] lg:text-[230px] leading-none font-black text-white/[0.07] select-none pointer-events-none"
                        >
                            P
                        </span>

                        {/* لوگو و بج وضعیت */}
                        <div className="relative z-10 flex items-center justify-between md:flex-col md:items-start gap-3 sm:gap-4">
                            <div className="flex items-center gap-3.5 md:block">
                                <div className="w-11 h-11 sm:w-12 sm:h-12 md:w-14 md:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_10px_20px_-6px_rgba(0,0,0,0.25)] flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                                    <span className='mt-1.5'>P</span>
                                </div>

                                {/* هدر فشرده در موبایل */}
                                <div className="md:hidden">
                                    <h1 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                                        ایجاد حساب کاربری
                                    </h1>
                                    <p className="text-rose-100/85 text-xs sm:text-sm">
                                        به خانواده Pinverse بپیوندید!
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-medium text-rose-50 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
                                عضویت رایگان
                            </span>
                        </div>

                        {/* بخش متن هدر در تبلت و دسکتاپ */}
                        <div className="relative z-10 hidden md:block mt-6 lg:mt-8">
                            <h1 className="text-xl lg:text-2xl font-black tracking-tight leading-tight">
                                ایجاد حساب کاربری
                            </h1>
                            <p className="text-rose-100/85 text-xs lg:text-sm mt-2 leading-relaxed max-w-[240px]">
                                به خانواده Pinverse بپیوندید! ایده‌ها را کشف کنید، ذخیره کنید و الهام بگیرید.
                            </p>

                            <div className="flex items-center gap-2 mt-5">
                                <span className="h-1 w-2.5 rounded-full bg-white/40" />
                                <span className="h-1 w-8 rounded-full bg-white" />
                                <span className="h-1 w-1.5 rounded-full bg-white/25" />
                            </div>
                        </div>
                    </div>

                    {/* پنل فرم ثبت‌نام */}
                    <div className="md:col-span-7 p-4 sm:p-5 md:p-6 lg:p-7 flex flex-col justify-center bg-white">
                        <div className="mb-3 sm:mb-3.5">
                            <p className="text-[10px] sm:text-xs font-bold tracking-wide text-rose-500 mb-0.5">
                                شروع مسیر
                            </p>
                            <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900">
                                مشخصاتت رو تکمیل کن
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
                            {serverError && (
                                <div
                                    role="alert"
                                    className="bg-rose-50/90 border border-rose-200/80 text-rose-700 px-3.5 sm:px-4 py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-start sm:items-center gap-2.5 shadow-sm shadow-rose-100"
                                >
                                    <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5 sm:mt-0" />
                                    <span className="font-medium leading-relaxed break-words">{serverError}</span>
                                </div>
                            )}

                            {/* چیدمان دو‌ستونه هوشمند برای نام و نام کاربری در نمایشگرهای sm به بالا */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 items-start">
                                <InputField
                                    id="name"
                                    label="نام کامل"
                                    icon={FiUser}
                                    value={name}
                                    onChange={setName}
                                    onBlur={() => validateField('name', name)}
                                    placeholder="مثال: علی محمدی"
                                    error={fieldErrors.name}
                                    autoComplete="name"
                                />

                                <InputField
                                    id="username"
                                    label="نام کاربری"
                                    icon={FiAtSign}
                                    value={username}
                                    onChange={setUsername}
                                    onBlur={() => validateField('username', username)}
                                    placeholder="ali_dev"
                                    error={fieldErrors.username}
                                    dir="ltr"
                                    hint="فقط حروف کوچک انگلیسی، عدد و _"
                                    autoComplete="username"
                                />
                            </div>

                            {/* ایمیل */}
                            <InputField
                                id="email"
                                label="ایمیل"
                                icon={FiMail}
                                value={email}
                                onChange={setEmail}
                                onBlur={() => validateField('email', email)}
                                placeholder="you@example.com"
                                error={fieldErrors.email}
                                dir="ltr"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                            />

                            {/* رمز عبور */}
                            <div className="space-y-1">
                                <label
                                    htmlFor="password"
                                    className="block text-xs font-bold text-slate-600 pr-1"
                                >
                                    رمز عبور
                                </label>
                                <div className="relative group">
                                    <span
                                        className={`absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-none ${
                                            fieldErrors.password
                                                ? 'bg-rose-100 text-rose-600 group-focus-within:bg-gradient-to-br group-focus-within:from-rose-500 group-focus-within:to-red-600 group-focus-within:text-white'
                                                : 'bg-slate-100 text-slate-400 group-focus-within:bg-gradient-to-br group-focus-within:from-rose-500 group-focus-within:to-red-600 group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-rose-500/25'
                                        }`}
                                    >
                                        <FiLock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="new-password"
                                        enterKeyHint="done"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={() => validateField('password', password)}
                                        placeholder="••••••••"
                                        className={`w-full min-h-[42px] sm:min-h-[44px] border rounded-xl sm:rounded-2xl pr-[46px] sm:pr-[50px] pl-[44px] sm:pl-[48px] py-2 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 ${
                                            fieldErrors.password
                                                ? 'bg-rose-50/40 border-rose-300 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                                : 'bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border-slate-200/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                                        }`}
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-2 sm:left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer touch-manipulation"
                                        aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}
                                    >
                                        {showPassword ? <FiEyeOff className="w-3.5 h-3.5" /> : <FiEye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>

                                {/* Strength Meter */}
                                {password && (
                                    <div className="mt-1.5 p-2 sm:p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-1 items-center gap-1.5">
                                                {[1, 2, 3, 4].map((i) => (
                                                    <div
                                                        key={i}
                                                        className={`h-1 sm:h-1.5 flex-1 rounded-full transition-all duration-300 ${
                                                            i <= strength.score ? strength.barColor : 'bg-slate-200/80'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                            <span className={`text-[10px] sm:text-[11px] font-bold shrink-0 ${strength.color}`}>
                                                {strength.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-snug">
                                            حداقل ۸ کاراکتر با حرف بزرگ، کوچک، عدد و نماد
                                        </p>
                                    </div>
                                )}

                                {fieldErrors.password && (
                                    <p className="mt-1 text-xs text-rose-600 flex items-center gap-1 pr-1 font-medium">
                                        <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{fieldErrors.password}</span>
                                    </p>
                                )}
                            </div>

                            {/* دکمه ثبت‌نام */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative w-full min-h-[44px] sm:min-h-[46px] overflow-hidden bg-gradient-to-l from-red-600 via-rose-600 to-rose-500 text-white text-sm sm:text-base font-bold py-2.5 sm:py-3 mt-1 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-[0_12px_28px_-8px_rgba(225,29,72,0.45)] hover:shadow-[0_20px_38px_-8px_rgba(225,29,72,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer touch-manipulation"
                            >
                                <span
                                    aria-hidden="true"
                                    className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                                />
                                {loading ? (
                                    <FiLoader className="w-4 h-4 animate-spin relative z-10" />
                                ) : (
                                    <FiUserPlus className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-x-0.5" />
                                )}
                                <span className="relative z-10">
                                    {loading ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}
                                </span>
                            </button>
                        </form>

                        {/* فوتر ورود */}
                        <div className="mt-3.5 sm:mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                            <span className="text-slate-500">حساب دارید؟</span>
                            <Link
                                href="/login"
                                className="group inline-flex items-center gap-1.5 text-rose-600 font-bold hover:text-rose-700 transition-colors py-0.5"
                            >
                                <span>وارد شوید</span>
                                <FiArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    )
}

// ─── کامپوننت Input قابل استفاده مجدد ───
function InputField({
    id,
    label,
    icon: Icon,
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    dir,
    type = 'text',
    hint,
    inputMode,
    autoComplete,
}: {
    id: string
    label: string
    icon: any
    value: string
    onChange: (v: string) => void
    onBlur: () => void
    placeholder: string
    error?: string
    dir?: 'ltr' | 'rtl'
    type?: string
    hint?: string
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
    autoComplete?: string
}) {
    return (
        <div className="space-y-1">
            <label
                htmlFor={id}
                className="block text-xs font-bold text-slate-600 pr-1"
            >
                {label}
            </label>
            <div className="relative group">
                <span
                    className={`absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg sm:rounded-xl flex items-center justify-center transition-all duration-300 pointer-events-none ${
                        error
                            ? 'bg-rose-100 text-rose-600 group-focus-within:bg-gradient-to-br group-focus-within:from-rose-500 group-focus-within:to-red-600 group-focus-within:text-white'
                            : 'bg-slate-100 text-slate-400 group-focus-within:bg-gradient-to-br group-focus-within:from-rose-500 group-focus-within:to-red-600 group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-rose-500/25'
                    }`}
                >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </span>
                <input
                    id={id}
                    type={type}
                    inputMode={inputMode}
                    autoComplete={autoComplete}
                    enterKeyHint="next"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={placeholder}
                    dir={dir}
                    className={`w-full min-h-[42px] sm:min-h-[44px] border rounded-xl sm:rounded-2xl pr-[46px] sm:pr-[50px] pl-3.5 sm:pl-4 py-2 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all duration-200 ${
                        error
                            ? 'bg-rose-50/40 border-rose-300 focus:bg-white focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            : 'bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border-slate-200/80 focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10'
                    }`}
                />
            </div>
            {error ? (
                <p className="mt-1 text-xs text-rose-600 flex items-start gap-1 pr-1 font-medium leading-snug">
                    <FiAlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                </p>
            ) : hint ? (
                <p className="mt-0.5 text-[10px] text-slate-400 pr-1 leading-snug">{hint}</p>
            ) : null}
        </div>
    )
}