import { ManagerOptions, SocketOptions, io } from 'socket.io-client'

const socketOptions: Partial<SocketOptions & ManagerOptions> = {
  forceNew: true,
  reconnection: true,
  timeout: 10000,
  transports: ['websocket'],
  autoConnect: true,
}

const url = 'http://localhost:3001'

const socket = io(url, socketOptions)
export default socket
