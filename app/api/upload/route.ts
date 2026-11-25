export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { rateLimit, getClientIp } from '@/lib/rateLimit'
import { getCurrentUser } from '@/lib/auth'   

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const MAX_SERVER_SIZE = 5 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'برای آپلود تصویر باید وارد حساب کاربری شوید' },
        { status: 401 }
      )
    }

    const rl = rateLimit(`upload_${user.id}_${getClientIp(request)}`, { limit: 35, windowMs: 600_000 })
    if (!rl.ok) {
      return NextResponse.json(
        { error: `سقف آپلود پر شده. ${rl.retryAfter} ثانیه دیگر تلاش کنید` },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'فایلی ارسال نشده' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'فقط تصویر مجاز است' }, { status: 400 })
    }

    if (file.size > MAX_SERVER_SIZE) {
      return NextResponse.json(
        { error: 'حجم تصویر بیش از ۵ مگابایت است' },
        { status: 413 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'pinterest-clone',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary Stream Error:', error)
            reject(error)
          } else {
            resolve(result)
          }
        }
      ).end(buffer)
    })

    return NextResponse.json({
      imageUrl: result.secure_url,
      width: result.width,
      height: result.height,
    }, { status: 201 })

  } catch (error: any) {
    console.error('❌ POST /api/upload error:', error)
    return NextResponse.json(
      { error: 'خطا در آپلود فایل', details: error.message || error },
      { status: 500 }
    )
  }
}