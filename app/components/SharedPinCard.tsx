"use client"

import Link from 'next/link'
import Image from 'next/image'
import { FiArrowLeft } from 'react-icons/fi'

type SharedPinCardProps = {
    pin: {
        id: string
        title: string
        imageUrl: string
        imageWidth: number | null
        imageHeight: number | null
    }
}

export default function SharedPinCard({ pin }: SharedPinCardProps) {
    return (
        <Link
            href={`/pin/${pin.id}`}
            className="block no-underline group/card w-full max-w-[220px] sm:max-w-[240px]"
        >
            <div className="relative overflow-hidden rounded-[15px] bg-white
    shadow-[0_4px_16px_rgba(0,0,0,0.1)] ring-1 ring-black/5
    transition-all duration-300
    group-hover/card:shadow-[0_10px_28px_rgba(0,0,0,0.14)]
    group-hover/card:-translate-y-1
    active:scale-[0.97]"
            >

                <Image
                    src={pin.imageUrl}
                    alt={pin.title}
                    width={pin.imageWidth || 500}
                    height={pin.imageHeight || 750}
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                />
            </div>
        </Link>
    )
}