'use client'

import { LOCAL_VIDEO, useWebRTC } from '@/hooks/useWebRTC'

const layout = (clients: number = 1) => {
  const pairs = Array.from({ length: clients }).reduce<any>(
    (acc, next, index, arr) => {
      if (index % 2 === 0) {
        acc.push(arr.slice(index, index + 2))
      }
      return acc
    },
    []
  )

  const rowsNumber = pairs.length
  const height = `${100 / rowsNumber}%`

  return pairs
    .map((row: any[], index: number, arr: any[]) => {
      if (index === arr.length - 1 && row.length === 1) {
        return [
          {
            width: '100%',
            height,
          },
        ]
      }

      return row.map(() => {
        return {
          width: '50%',
          height,
        }
      })
    })
    .flat()
}

export default function Room({
  params: { slug },
}: {
  params: { slug: string }
}) {
  const { clients, provideMediaRef } = useWebRTC(slug)
  const videoLayout = layout(clients.length)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        height: '100vh',
      }}
    >
      {clients.map((clientId, index) => {
        return (
          <div key={clientId} style={{ width: '33%' }}>
            <video
              ref={(ref) => {
                provideMediaRef(clientId, ref)
              }}
              width="100%"
              height="100%"
              autoPlay
              playsInline
              muted={clientId === LOCAL_VIDEO}
            ></video>
          </div>
        )
      })}
    </div>
  )
}
