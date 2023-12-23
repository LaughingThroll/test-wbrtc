const path = require('path')
const express = require('express')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const { validate, version } = require('uuid')

const PORT = process.env.PORT || 3001

const ACTIONS = {
  JOIN: 'join',
  LEAVE: 'leave',
  SHARE_ROOMS: 'share-rooms',
  ADD_PEER: 'add-peer',
  REMOVE_PEER: 'remove-peer',
  RELAY_SDP: 'relay-sdp',
  RELAY_ICE: 'relay-ice',
  ICE_CANDIDATE: 'ice-candidate',
}

const getClientRooms = () => {
  const { rooms } = io.sockets.adapter

  return Array.from(rooms.keys()).filter(
    (roomId) => validate(roomId) && version(roomId)
  )
}

const shareRoomsInfo = () => {
  io.emit(ACTIONS.SHARE_ROOMS, {
    rooms: getClientRooms(),
  })
}

io.on('connection', (socket) => {
  shareRoomsInfo()

  socket.on(ACTIONS.JOIN, (config) => {
    const { room: roomId } = config
    const { rooms: joinedRooms } = socket

    if ([...joinedRooms].includes(roomId)) {
      return console.warn('Already is connect to room: ', id)
    }

    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])

    clients.forEach((clientId) => {
      io.to(clientId).emit(ACTIONS.ADD_PEER, {
        peerId: socket.id,
        createOffer: false,
      })

      socket.emit(ACTIONS.ADD_PEER, {
        peerId: clientId,
        createOffer: true,
      })
    })

    socket.join(roomId)
    shareRoomsInfo()
  })

  const leaveRoom = () => {
    const { rooms } = socket

    Array.from(rooms).forEach((roomId) => {
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || [])

      clients.forEach((clientId) => {
        io.to(clientId).emit(ACTIONS.REMOVE_PEER, {
          peerId: socket.id,
        })

        socket.emit(ACTIONS.REMOVE_PEER, {
          peerId: clientId,
        })
      })

      socket.leave(roomId)
    })

    shareRoomsInfo()
  }

  socket.on(ACTIONS.LEAVE, leaveRoom)
  socket.on('disconnecting', leaveRoom)
  console.log('Socket connected')
})

server.listen(PORT, (e) => {
  console.log('Server started')
})
