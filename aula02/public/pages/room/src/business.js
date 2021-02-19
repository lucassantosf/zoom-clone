class Business{
  constructor({room,media,view, socketBuilder, peerBuilder}){
    this.media = media
    this.room = room
    this.view = view
    this.socketBuilder = socketBuilder
    this.peerBuilder = peerBuilder
        
    this.currentStream = {}
    this.socket = {}
    this.currentPeer = {}

    this.peers = new Map()
  }
  
  static initialize(deps){
    const instance = new Business(deps)
    return instance._init()
  }

  async _init(){
    this.currentStream = await this.media.getCamera()

    this.socket = this.socketBuilder.setOnUserConnected(this.onUserConnected())
    .setOnUserDisconnected(this.onUserDisconnected())
    .build()

    this.currentPeer = await this.peerBuilder
                        .setOnError(this.onPeerError())
                        .setonConnectionOpened(this.onConnectionOpened())
                        .setOnCallReceived(this.onPeerCallReceived())
                        .setOnPeerStreamReceveid(this.onPeerStreamReceveid())
                        .build()

    this.addVideoStream('teste01')
  }

  addVideoStream(userId, stream = this.currentStream){
    const isCurrentId = false
    this.view.renderVideo({userId, stream, isCurrentId})
  }

  onUserConnected = function(){
    return userId=>{
      console.log('user connected',userId)
      this.currentPeer.call(userId, this.currentStream)
    }
  }

  onUserDisconnected = function(){
    return userId=>{
      console.log('user disconnected',userId)
    }
  }

  onPeerError = function(){
    return error=>{
      console.error('error on peer',error)
    }
  }

  onConnectionOpened = function(){
    return peer => {
      const id  = peer.id
      console.log('peer',peer)
      this.socket.emit('join-room', this.room, id)

    }
  }

  onPeerCallReceived = function (){
    return call => {
      console.log("answering call",call)
      call.answer(this.currentStream)
    }
  }

  onPeerStreamReceveid = function (){
    return (call,stream) =>{
      const callerId = call.peer
      this.addVideoStream(callerId,stream)
      this.peers.set(callerId, { call })
      
      this.view.setParticipants(this.peers.size)
    }
  }
}