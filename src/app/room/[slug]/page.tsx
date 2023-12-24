'use client'

import { LOCAL_VIDEO, useWebRTC } from '@/hooks/useWebRTC'

export default function Room({
  params: { slug },
}: {
  params: { slug: string }
}) {
  const { clients, provideMediaRef } = useWebRTC(slug)

  return (
    <div>
      {clients.map((clientId) => {
        return (
          <div key={clientId}>
            <video
              ref={(ref) => {
                provideMediaRef(clientId, ref)
              }}
              autoPlay
              playsInline
              muted={clientId === LOCAL_VIDEO}
            ></video>
          </div>
        )
      })}
      Room number {slug}
    </div>
  )
}
