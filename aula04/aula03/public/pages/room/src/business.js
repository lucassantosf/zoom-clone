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
    this.usersRecordings = new Map()
  } 
  
  static initialize(deps){
    const instance = new Business(deps)
    return instance._init()
  }

  async _init(){
    this.view.configureRecordButton(this.onRecordPressed.bind(this))

    this.currentStream = await this.media.getCamera()

    this.socket = this.socketBuilder.setOnUserConnected(this.onUserConnected())
    .setOnUserDisconnected(this.onUserDisconnected())
    .build()

    this.currentPeer = await this.peerBuilder
                        .setOnError(this.onPeerError())
                        .setonConnectionOpened(this.onConnectionOpened())
                        .setOnCallReceived(this.onPeerCallReceived())
                        .setOnPeerStreamReceveid(this.onPeerStreamReceveid())
                        .setOnCallError(this.onPeerCallError())
                        .setOnCallClose(this.onPeerCallClose())
                        .build()

    this.addVideoStream(this.currentPeer.id)
  }

  addVideoStream(userId, stream = this.currentStream){
    const recorderInstance = new Recorder(userId,stream)
    this.userRecordings.set(recorderInstance.filename,recorderInstance)
    if(this.recordingEnabled){
      recorderInstance.startRecording()
    } 

    const isCurrentId = false
    this.view.renderVideo({userId, stream, isCurrentId})
  }

  onUserConnected(){
    return userId=>{
      console.log('user connected',userId)
      this.currentPeer.call(userId, this.currentStream)
    }
  }

  onUserDisconnected(){
    return userId=>{
      console.log('user disconnected',userId)
      if(this.peers.has(userId)){
        this.peers.get(userId).call.close()
        this.peers.delete(userId)
      }
      this.view.setParticipants(this.peers.size)
      this.view.removeVideoElement(userId)
    }
  }

  onPeerError(){
    return error=>{
      console.error('error on peer',error)
    }
  }

  onConnectionOpened(){
    return peer => {
      const id  = peer.id
      console.log('peer',peer)
      this.socket.emit('join-room', this.room, id)

    }
  }

  onPeerCallReceived (){
    return call => {
      console.log("answering call",call)
      call.answer(this.currentStream)
    }
  }

  onPeerStreamReceveid (){
    return (call,stream) =>{
      const callerId = call.peer
      this.addVideoStream(callerId,stream)
      this.peers.set(callerId, { call })
      
      this.view.setParticipants(this.peers.size)
    }
  }

  onPeerCallError(){
    return (call,error)=>{
      console.error('an call error ocurred',error)
      this.view.removeVideoElement(call.peer)
    }
  }

  onPeerCallClose(){
    return call => {
      console.log('call closed!',call.peer)
    }
  }

  onRecordPressed(recordingEnabled){
    this.recordingEnabled = recordingEnabled
    console.log('pressionou')
    for(const[key,value] of this.usersRecordings){
      if(this.recordingEnabled){
        value.startRecording()
        continue;
      }
      this.stopRecording(key)
    } 
  }

  //se um usuario entrar e sair da call durante a gravacao
  //precisa  parar as gravacoes anteriores
  async stopRecording(userId){
    const usersRecordings = this.usersRecordings
    for(const[key,value] of usersRecordings){
      const isContextUSer = key.includes(userId)
      if(!isContextUSer) continue;
      
      const rec = value
      const isRecordingActive = rec.recordingActive
      if(!isRecordingActive) continue;

      await rec.stopRecording()
    } 
  }  
}