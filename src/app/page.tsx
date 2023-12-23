'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { v4 } from 'uuid'
import socket from '@/socket'
import { ACTIONS } from '@/socket/actions'
import './globals.css'

export default function Home() {
  const router = useRouter()
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    socket.on(ACTIONS.SHARE_ROOMS, ({ rooms = [] }: any) => {
      setRooms(rooms)
      console.log(rooms)
    })
    console.log('go to server')
  }, [])

  return (
    <main>
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
