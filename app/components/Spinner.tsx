"use client"

const SIZES = {
    xs: { box: 'w-4 h-6', ball: 'w-1.5 h-1.5' },
    sm: { box: 'w-6 h-9', ball: 'w-2 h-2' },
    md: { box: 'w-8 h-12', ball: 'w-3 h-3' },
    lg: { box: 'w-12 h-20', ball: 'w-4 h-4' },
} as const

type SpinnerSize = keyof typeof SIZES

type SpinnerProps = {
    size?: SpinnerSize
    label?: string    
    className?: string 
}

function SpinnerCore({ s, className }: { s: (typeof SIZES)[SpinnerSize]; className: string }) {
    return (
        <span
            role="status"
            aria-label="در حال بارگذاری"
            className={`relative inline-block gravity-spinner ${s.box} ${className}`}
        >
            <span className="gravity-shadow" />

            <span className="gravity-fall">
                <span className={`gravity-ball rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 ${s.ball}`} />
            </span>
        </span>
    )
}

export default function Spinner({ size = 'md', label, className = '' }: SpinnerProps) {
    const s = SIZES[size]

    return (
        <>
            {label ? (
                <div className="flex flex-col items-center justify-center gap-2.5">
                    <SpinnerCore s={s} className={className} />
                    <span className="text-xs text-gray-400 font-medium">{label}</span>
                </div>
            ) : (
                <SpinnerCore s={s} className={className} />
            )}

            <style>{`
                .gravity-spinner { isolation: isolate; }

                /* ── چرخه سقوط: هر segment تایمینگ خودش رو داره ── */
                .gravity-fall {
                    position: absolute;
                    inset: 0;
                    animation: gravityFall 1.5s infinite;
                    will-change: transform;
                }

                /* ── گوی: با هایلایت شیشه‌ای و اسکواش برخورد ── */
                .gravity-ball {
                    position: absolute;
                    top: 0;
                    left: 50%;
                    translate: -50% 0;
                    transform-origin: 50% 100%;
                    box-shadow:
                        0 2px 8px rgba(239, 68, 68, 0.35),
                        inset 0 -2px 4px rgba(0, 0, 0, 0.12);
                    animation: gravitySquash 1.5s infinite;
                }
                .gravity-ball::before {
                    content: '';
                    position: absolute;
                    top: 18%;
                    left: 22%;
                    width: 30%;
                    height: 30%;
                    border-radius: 9999px;
                    background: rgba(255, 255, 255, 0.55);
                    filter: blur(1px);
                }

                /* ── سایه زمین: هم‌دوره با سقوط ── */
                .gravity-shadow {
                    position: absolute;
                    bottom: 0;
                    left: 50%;
                    translate: -50% 0;
                    width: 70%;
                    height: 9%;
                    border-radius: 9999px;
                    background: radial-gradient(ellipse, rgba(239, 68, 68, 0.35), transparent 70%);
                    animation: gravityShadow 1.5s infinite;
                }

                /* ═══ keyframes ═══ */

                @keyframes gravityFall {
                    /* قله: مکث کوتاه (hang time) */
                    0%   { transform: translateY(0);    animation-timing-function: cubic-bezier(0.45, 0, 0.9, 0.6); }
                    /* سقوط با شتاب تا برخورد واحد */
                    38%  { transform: translateY(58%);  animation-timing-function: cubic-bezier(0.2, 0.7, 0.35, 1); }
                    /* برخاست با کاهش سرعت (نه پرش — ادامه‌ی همون مسیر) */
                    85%  { transform: translateY(0);    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1); }
                    /* مکث دوم در قله قبل از چرخه بعدی */
                    100% { transform: translateY(0); }
                }

                @keyframes gravitySquash {
                    0%, 33%  { transform: scale(1); }
                    38%      { transform: scale(1.38, 0.62); }  /* برخورد — اسکواش قوی و تنها */
                    47%      { transform: scale(0.92, 1.08); }  /* rebound کش‌مانند */
                    56%      { transform: scale(1); }
                    100%     { transform: scale(1); }
                }

                @keyframes gravityShadow {
                    0%   { transform: scale(0.45); opacity: 0.2; }
                    38%  { transform: scale(1);    opacity: 0.6; }
                    85%  { transform: scale(0.45); opacity: 0.2; }
                    100% { transform: scale(0.45); opacity: 0.2; }
                }
                @media (prefers-reduced-motion: reduce) {
                    .gravity-fall   { animation: none; transform: translateY(29%); }
                    .gravity-shadow { animation: none; opacity: 0.3; }
                    .gravity-ball   { animation: gravityCalm 2s ease-in-out infinite; }
                }
                @keyframes gravityCalm {
                    0%, 100% { transform: scale(0.9); opacity: 0.7; }
                    50%      { transform: scale(1);   opacity: 1; }
                }
            `}</style>
        </>
    )
}