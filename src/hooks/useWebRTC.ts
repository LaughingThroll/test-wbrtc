import { MutableRefObject, useCallback, useEffect, useRef } from 'react'
import { useStateWithCallback } from './useStateWithCallback'
import socket from '@/socket'
import { ACTIONS } from '@/socket/actions'

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

export const useWebRTC = (roomId: string) => {
  const [clients, updateClients] = useStateWithCallback<string[]>([])

  const peerConnections = useRef({})
  const localMediaStream = useRef<MediaStream>()
  const peerMediaElements = useRef<{ [key: string]: HTMLVideoElement | null }>({
    [LOCAL_VIDEO]: null,
  })

  const addNewClient = useCallback(
    (newClient: string, cb: Function) => {
      if (!clients.includes(newClient)) {
        //@ts-ignore
        updateClients((list) => [...list, newClient], cb)
      }
    },
    [clients, updateClients]
  )

  useEffect(() => {
    const startCapture = async () => {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 1280,
          height: 720,
        },
      })

      addNewClient(LOCAL_VIDEO, () => {
        const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]

        if (localVideoElement && localMediaStream.current) {
          localVideoElement.volume = 0
          localVideoElement.srcObject = localMediaStream.current
        }
      })
    }

    startCapture()
      .then(() => {
        socket.emit(ACTIONS.JOIN, {
          room: roomId,
        })
      })
      .catch((e) => {
        console.error('Error getting userMedia', e)
      })
  }, [addNewClient, roomId])

  return { clients }
}
