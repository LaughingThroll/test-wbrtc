'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 } from 'uuid'
import socket from '@/socket'
import { ACTIONS } from '@/socket/actions'
import './globals.css'

export default function Home() {
  const router = useRouter()
  const [rooms, setRooms] = useState([])
  const rootNode = useRef<HTMLElement>(null)

  useEffect(() => {
    socket.on(ACTIONS.SHARE_ROOMS, ({ rooms }: any) => {
      if (rootNode.current) {
        setRooms(rooms)
      }
    })
  }, [rooms])

  return (
    <main ref={rootNode}>
      <h1>Available Rooms</h1>
      <ul>
        {rooms.map((roomId) => (
          <li key={roomId}>
            {roomId}
            <button
              onClick={() => {
                router.push(`room/${roomId}`)
              }}
            >
              Join to room
            </button>
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          router.push(`room/${v4()}`)
        }}
      >
        Create new room
      </button>
    </main>
  )
}
