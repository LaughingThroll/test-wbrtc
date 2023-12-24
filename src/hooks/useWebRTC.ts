import { MutableRefObject, useCallback, useEffect, useRef } from 'react'
// @ts-ignore
import freeice from 'freeice'
import { useStateWithCallback } from './useStateWithCallback'
import socket from '@/socket'
import { ACTIONS } from '@/socket/actions'

export const LOCAL_VIDEO = 'LOCAL_VIDEO'

export const useWebRTC = (roomId: string) => {
  const [clients, updateClients] = useStateWithCallback<string[]>([])

  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({})
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
    const handleNewPeer = async ({
      peerId,
      createOffer,
    }: {
      peerId: string
      createOffer: boolean
    }) => {
      if (peerConnections.current[peerId]) {
        return console.warn('Already connected to peer ', peerId)
      }

      peerConnections.current[peerId] = new RTCPeerConnection({
        iceServers: freeice(),
      })

      peerConnections.current[peerId].onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(ACTIONS.RELAY_ICE, {
            peerId,
            iceCandidate: event.candidate,
          })
        }
      }

      let tracksNumber = 0
      peerConnections.current[peerId].ontrack = ({
        streams: [remoteStream],
      }) => {
        tracksNumber++

        if (tracksNumber)
          // audio and video track {
          addNewClient(peerId, () => {
            peerMediaElements.current[peerId]!.srcObject = remoteStream
          })
      }

      localMediaStream.current?.getTracks().forEach((track) => {
        if (localMediaStream.current) {
          peerConnections.current[peerId].addTrack(
            track,
            localMediaStream.current
          )
        }
      })

      if (createOffer) {
        const offer = await peerConnections.current[peerId].createOffer()

        await peerConnections.current[peerId].setLocalDescription(offer)

        socket.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: offer,
        })
      }
    }

    socket.on(ACTIONS.ADD_PEER, handleNewPeer)
  }, [])

  useEffect(() => {
    const setRemoteMedia = async ({ peerId, sessionDescription }: any) => {
      await peerConnections.current[peerId].setRemoteDescription(
        new RTCSessionDescription(sessionDescription)
      )

      if (sessionDescription.type === 'offer') {
        const answer = await peerConnections.current[peerId].createAnswer()

        await peerConnections.current[peerId].setLocalDescription(answer)

        socket.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: answer,
        })
      }
    }

    socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)
  }, [])

  useEffect(() => {
    socket.on(ACTIONS.ICE_CANDIDATE, ({ peerId, iceCandidate }: any) => {
      peerConnections.current[peerId].addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      )
    })
  }, [])

  useEffect(() => {
    socket.on(ACTIONS.REMOVE_PEER, ({ peerId }) => {
      if (peerConnections.current[peerId]) {
        peerConnections.current[peerId].close()
      }

      delete peerConnections.current[peerId]
      delete peerMediaElements.current[peerId]

      // @ts-ignore
      updateClients((list) => list.filter((client) => client !== peerId))
    })
  }, [])

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

    return () => {
      localMediaStream.current?.getTracks().forEach((track) => track.stop())
      socket.emit(ACTIONS.LEAVE)
    }
  }, [roomId])

  const provideMediaRef = useCallback(
    (id: string, node: HTMLVideoElement | null) => {
      peerMediaElements.current[id] = node
    },
    []
  )

  return { clients, provideMediaRef }
}
