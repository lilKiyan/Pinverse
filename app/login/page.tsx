"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FiLogIn, FiMail, FiLock, FiAlertCircle, FiLoader, FiArrowLeft } from 'react-icons/fi'
import { useAuthStore } from '@/lib/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'خطا در ورود')
      }

      // ✅ کاربر را در store ذخیره کنید
      if (data.user) {
        setUser(data.user)
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطا')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      dir="rtl"
      className="relative h-full w-full flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-hidden bg-[#fff9f8] selection:bg-rose-500 selection:text-white"
    >
      {/* کانتینر مجزا برای پس‌زمینه تا بدون ایجاد اسکرول افقی، اسکرول عمودی در موبایل و حالت افقی آزاد باشد */}
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

      {/* قاب بیرونی شیشه‌ای دو‌لایه با ابعاد هوشمند و متناسب در تمام نمایشگرها */}
      <div className="relative z-10 w-full max-w-[420px] sm:max-w-[480px] md:max-w-[740px] lg:max-w-[860px] p-1.5 sm:p-2.5 rounded-[26px] sm:rounded-[32px] bg-white/65 backdrop-blur-2xl shadow-[0_20px_60px_-18px_rgba(190,18,60,0.2)] lg:shadow-[0_28px_80px_-22px_rgba(190,18,60,0.22)] ring-1 ring-rose-950/[0.06]">
        <div className="grid grid-cols-1 md:grid-cols-12 bg-white rounded-[20px] sm:rounded-[24px] overflow-hidden ring-1 ring-slate-100">

          {/* پنل هنری و هدر: فشرده و بهینه در موبایل، تمام‌قد در تبلت و دسکتاپ */}
          <div className="relative md:col-span-5 flex flex-col justify-between p-4 sm:p-6 md:p-7 lg:p-8 text-white overflow-hidden bg-gradient-to-br from-rose-500 via-red-600 to-rose-950">
            {/* عناصر نوری و هندسی پس‌زمینه پنل */}
            <div className="absolute -top-16 -left-16 w-48 h-48 sm:w-64 sm:h-64 bg-orange-400/35 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-14 w-56 h-56 sm:w-72 sm:h-72 bg-rose-400/25 rounded-full blur-3xl pointer-events-none" />

            <div className="hidden sm:block absolute -bottom-28 -left-20 w-72 h-72 rounded-full border border-white/15 pointer-events-none" />
            <div className="hidden sm:block absolute -bottom-20 -left-12 w-52 h-52 rounded-full border border-white/10 pointer-events-none" />

            {/* واترمارک حرف P متناسب با سایز صفحه */}
            <span
              aria-hidden="true"
              className="absolute -bottom-6 -left-2 sm:-bottom-8 sm:-left-3 md:-bottom-10 md:-left-4 text-[115px] sm:text-[150px] md:text-[190px] lg:text-[230px] leading-none font-black text-white/[0.07] select-none pointer-events-none"
            >
              P
            </span>

            {/* ردیف لوگو و بج وضعیت */}
            <div className="relative z-10 flex items-center justify-between md:flex-col md:items-start gap-3 sm:gap-4">
              <div className="flex items-center gap-3.5 md:block">
                <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 shrink-0 rounded-xl sm:rounded-2xl bg-white/15 backdrop-blur-xl border border-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5),0_10px_20px_-6px_rgba(0,0,0,0.25)] flex items-center justify-center text-white text-2xl sm:text-3xl font-black">
                  <span className='mt-1.5'>P</span>
                </div>

                {/* عنوان فشرده در موبایل کنار لوگو برای حفظ فضای عمودی */}
                <div className="md:hidden">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                    ورود به حساب
                  </h1>
                  <p className="text-rose-100/85 text-xs sm:text-sm">
                    خوش برگشتی!
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] sm:text-[11px] font-medium text-rose-50 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" />
                ورود امن
              </span>
            </div>

            {/* بخش متن کامل هدر در تبلت و دسکتاپ */}
            <div className="relative z-10 hidden md:block mt-8 lg:mt-10">
              <h1 className="text-xl lg:text-2xl font-black tracking-tight leading-tight">
                ورود به حساب
              </h1>
              <p className="text-rose-100/85 text-xs lg:text-sm mt-2 leading-relaxed max-w-[240px]">
                خوش برگشتی! فقط یک قدم تا ادامه مسیر و دسترسی به پنل کاربری فاصله داری.
              </p>

              <div className="flex items-center gap-2 mt-6">
                <span className="h-1 w-8 rounded-full bg-white" />
                <span className="h-1 w-2 rounded-full bg-white/40" />
                <span className="h-1 w-1.5 rounded-full bg-white/25" />
              </div>
            </div>
          </div>

          {/* پنل فرم ورود */}
          <div className="md:col-span-7 p-4 sm:p-6 md:p-7 lg:p-8 flex flex-col justify-center bg-white">
            <div className="mb-3.5 sm:mb-4">
              <p className="text-[11px] sm:text-xs font-bold tracking-wide text-rose-500 mb-0.5">
                احراز هویت
              </p>
              <h2 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900">
                اطلاعات حسابت رو وارد کن
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-3.5">
              {error && (
                <div
                  role="alert"
                  className="bg-rose-50/90 border border-rose-200/80 text-rose-700 px-3.5 sm:px-4 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-start sm:items-center gap-2.5 shadow-sm shadow-rose-100"
                >
                  <FiAlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5 sm:mt-0" />
                  <span className="font-medium leading-relaxed break-words">{error}</span>
                </div>
              )}

              {/* ایمیل */}
              <div className="space-y-1 sm:space-y-1.5">
                <label
                  htmlFor="email"
                  className="block text-xs font-bold text-slate-600 pr-1"
                >
                  ایمیل
                </label>
                <div className="relative group">
                  <span className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center transition-all duration-300 group-focus-within:bg-gradient-to-br group-focus-within:from-rose-500 group-focus-within:to-red-600 group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-rose-500/25 pointer-events-none">
                    <FiMail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    enterKeyHint="next"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[44px] sm:min-h-[46px] bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl pr-[48px] sm:pr-[54px] pl-3.5 sm:pl-4 py-2.5 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all duration-200"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* رمز عبور */}
              <div className="space-y-1 sm:space-y-1.5">
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-600 pr-1"
                >
                  رمز عبور
                </label>
                <div className="relative group">
                  <span className="absolute right-2 sm:right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center transition-all duration-300 group-focus-within:bg-gradient-to-br group-focus-within:from-rose-500 group-focus-within:to-red-600 group-focus-within:text-white group-focus-within:shadow-md group-focus-within:shadow-rose-500/25 pointer-events-none">
                    <FiLock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    enterKeyHint="done"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full min-h-[44px] sm:min-h-[46px] bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200/80 rounded-xl sm:rounded-2xl pr-[48px] sm:pr-[54px] pl-3.5 sm:pl-4 py-2.5 sm:py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-500/10 transition-all duration-200"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* دکمه ورود با سایز استاندارد */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full min-h-[46px] sm:min-h-[48px] overflow-hidden bg-gradient-to-l from-red-600 via-rose-600 to-rose-500 text-white text-sm sm:text-base font-bold py-3 mt-1.5 rounded-xl sm:rounded-2xl transition-all duration-300 shadow-[0_12px_28px_-8px_rgba(225,29,72,0.45)] hover:shadow-[0_20px_38px_-8px_rgba(225,29,72,0.55)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer touch-manipulation"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
                />
                {loading ? (
                  <FiLoader className="w-4 h-4 animate-spin relative z-10" />
                ) : (
                  <FiLogIn className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:-translate-x-0.5" />
                )}
                <span className="relative z-10">
                  {loading ? 'در حال ورود...' : 'ورود به حساب'}
                </span>
              </button>
            </form>

            {/* فوتر ثبت‌نام */}
            <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="text-slate-500">حساب نداری؟</span>
              <Link
                href="/register"
                className="group inline-flex items-center gap-1.5 text-rose-600 font-bold hover:text-rose-700 transition-colors py-1"
              >
                <span>ثبت‌نام کن</span>
                <FiArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </main>
  )
}