class View {
  constructor() {

  }

  createVideoElement({ muted = true, src, srcObject }) {
    const video = document.createElement('video')
    video.muted = muted
    video.src = src
    video.srcObject = srcObject

    if (src) {
      video.constrols = true
      video.loop = true
      Util.sleep(200).then(_ => video.play())
    }

    return video
  }

  renderVideo({ stream = null, url = null }) {
    const video = this.createVideoElement({ src })
  }

  // 18:59


}