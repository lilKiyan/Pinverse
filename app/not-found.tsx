import Link from 'next/link'
import { FiArrowRight, FiSearch, FiMapPin } from 'react-icons/fi'

export default function NotFound() {
    return (
        <main className="relative min-h-screen bg-white flex flex-col items-center justify-center px-4 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-red-100 rounded-full blur-3xl opacity-60" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-70" />

            <FiMapPin className="pin-float pin-float-1 absolute top-[18%] left-[14%] w-6 h-6 text-red-200" />
            <FiMapPin className="pin-float pin-float-2 absolute top-[28%] right-[16%] w-8 h-8 text-red-100" />
            <FiMapPin className="pin-float pin-float-3 absolute bottom-[22%] left-[20%] w-5 h-5 text-orange-200" />
            <FiMapPin className="pin-float pin-float-1 absolute bottom-[30%] right-[12%] w-7 h-7 text-red-200" />

            <div className="relative z-10">
                <h1 className="text-9xl md:text-[12rem] font-black bg-gradient-to-b from-gray-200 to-gray-100 bg-clip-text text-transparent select-none tracking-tight">
                    404
                </h1>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="magnifier-bounce w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-white shadow-xl ring-1 ring-black/5 flex items-center justify-center">
                        <FiSearch className="w-9 h-9 md:w-12 md:h-12 text-red-500" />
                    </div>
                </div>
            </div>

            <div className="relative z-10 text-center -mt-2 md:-mt-4">
                <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-3">
                    صفحه‌ای که دنبالش بودی پیدا نشد
                </h2>
                <p className="text-gray-500 text-base md:text-lg mb-8 max-w-md mx-auto leading-relaxed">
                    شاید آدرس اشتباه است یا صفحه حذف شده. نگران نباش، می‌تونی به خانه برگردی و پین‌های جدید پیدا کنی.
                </p>

                <div className="flex flex-col sm:flex-row justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-red-100 hover:shadow-red-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 no-underline"
                    >
                        بازگشت به خانه
                        <FiArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-200 to-transparent" />

            <style>{`
        @keyframes pinFloat1 {
          0%, 100% { transform: translateY(0) rotate(-6deg); }
          50% { transform: translateY(-14px) rotate(-2deg); }
        }
        @keyframes pinFloat2 {
          0%, 100% { transform: translateY(0) rotate(8deg); }
          50% { transform: translateY(-18px) rotate(4deg); }
        }
        @keyframes pinFloat3 {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes magnifierBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.04); }
        }
        .pin-float-1 { animation: pinFloat1 4.5s ease-in-out infinite; }
        .pin-float-2 { animation: pinFloat2 5.5s ease-in-out infinite; }
        .pin-float-3 { animation: pinFloat3 5s ease-in-out infinite; }
        .magnifier-bounce { animation: magnifierBounce 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .pin-float-1, .pin-float-2, .pin-float-3, .magnifier-bounce {
            animation: none;
          }
        }
      `}</style>
        </main>
    )
}