"use client"

import Link from 'next/link'
import Image from 'next/image'
import { FiCheck, FiUserPlus } from 'react-icons/fi'

export type SearchUser = {
  id: string
  name: string
  username: string
  avatar: string | null
  bio: string | null
  followersCount: number
  isFollowing: boolean
}

type UserCardProps = {
  user: SearchUser
  currentUserId?: string
  onToggleFollow: (user: SearchUser) => void
  isFollowPending: boolean
}

export default function UserCard({
  user,
  currentUserId,
  onToggleFollow,
  isFollowPending,
}: UserCardProps) {
  const isMe = currentUserId === user.id

  return (
    <div className="flex items-center gap-4 p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm shadow-gray-200/50 ring-1 ring-black/5 hover:shadow-xl hover:shadow-red-100/40 hover:ring-red-200/70 transition-all duration-300">
      <Link
        href={`/user/${user.id}`}
        className="flex items-center gap-4 flex-1 min-w-0 no-underline group"
      >
        <div className="p-[2.5px] rounded-full bg-gradient-to-br from-red-500 via-rose-500 to-orange-400 shrink-0">
          <div className="relative w-14 h-14 rounded-full overflow-hidden bg-white ring-2 ring-white flex items-center justify-center text-xl font-bold text-white bg-gradient-to-br from-red-500 to-orange-500">
            {user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>
                {user.username?.charAt(0).toUpperCase() || '؟'}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate text-[15px] group-hover:text-red-600 transition-colors">
            {user.name}
          </p>
          <p className="text-sm text-gray-400 truncate text-right" dir="ltr">
            @{user.username}
          </p>
          {user.bio && (
            <p className="text-xs text-gray-500 truncate mt-1">{user.bio}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            <span className="font-bold text-gray-600 tabular-nums">
              {user.followersCount}
            </span>{' '}
            دنبال‌کننده
          </p>
        </div>
      </Link>

      {!isMe && (
        <button
          onClick={() => onToggleFollow(user)}
          disabled={isFollowPending}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer active:scale-95 ${
            user.isFollowing
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              : 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200/60'
          } ${isFollowPending ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isFollowPending ? (
            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : user.isFollowing ? (
            <FiCheck className="w-3.5 h-3.5" />
          ) : (
            <FiUserPlus className="w-3.5 h-3.5" />
          )}
          {user.isFollowing ? 'دنبال شده' : 'دنبال کردن'}
        </button>
      )}
    </div>
  )
}