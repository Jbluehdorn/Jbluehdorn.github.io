let cb, ctx, h, w, cntrX, cntrY, images, imgCount, imgH, imgW, rAF, audio

let loopCount = 0, dScale = 1, audioHasPlayed = false

const animate = () => {
    rAF = requestAnimationFrame(animate)

    if(loopCount >= 175) {
        ctx.restore()
        ctx.clearRect(0, 0, w, h)
        ctx.resetTransform()
        cancelAnimationFrame(rAF)
        audioHasPlayed = false
        typeof cb === 'function' && cb()
        return
    }

    if(loopCount < 75) {
        drawImages()
        loopCount++
        return
    }

    if(audio && !audioHasPlayed) {
        audioHasPlayed = true
        audio.play()
    }

    //clear the canvas 
    ctx.restore()
    ctx.clearRect(-2, -2, w + 2, h + 2)

    // rotate about center
    ctx.translate(cntrX, cntrY)
    ctx.rotate(5 * Math.PI / 180)
    ctx.translate(-cntrX, -cntrY)

    // move and scale
    ctx.translate(cntrX - (cntrX * dScale), cntrY - (cntrY * dScale))
    ctx.scale(dScale, dScale)

    drawImages()

    dScale *= .999
    loopCount++
}

const drawImages = () => {
    let topImages = images.slice(0, Math.ceil(imgCount / 2))
    let botImages = images.slice(Math.ceil(imgCount / 2), imgCount)
    let topSize = w / topImages.length
    let botSize = w / botImages.length

    // Draw top images
    for(let i = 0; i < topImages.length; i++) {
        let xCoord = (topSize * i) + topSize / 2 - imgW / 2
        let yCoord = 0
        ctx.drawImage(topImages[i], xCoord, yCoord, imgW, imgH)
    }

    // Draw bottom images
    for(let i = 0; i < botImages.length; i++) {
        let xCoord = botSize * i + botSize / 2 - imgW / 2
        let yCoord = h - imgH
        ctx.drawImage(botImages[i], xCoord, yCoord, imgW, imgH) 
    }
}

export const spinImages = (canvas, callback, args) => {
    let opts = opts = {
        images: [],
        sound: null,
        ...args
    }
    loopCount = 0
    dScale = 1
    audioHasPlayed = false

    cb = callback

    ctx = canvas.getContext('2d')
    h = canvas.height
    w = canvas.width
    cntrX = w / 2
    cntrY = h / 2

    ctx.save()

    ctx.textBaseLine = 'middle'
    ctx.textAlign = 'center'

    images = opts.images
    imgCount = images.length

    audio = opts.audio

    imgH = 150
    imgW = 150

    animate()
}