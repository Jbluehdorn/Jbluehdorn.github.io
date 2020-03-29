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
    ctx.save()

    for(let i = 0; i < imgCount; i++) {
        ctx.save()
        let rads = 360 / imgCount * Math.PI / 180 * i

        // Rotate and return
        ctx.translate(cntrX, cntrY)
        ctx.rotate(rads)
        ctx.translate(0, -h/2 + imgH/2)

        // Rotate back
        ctx.rotate(-rads)

        // Draw image
        ctx.drawImage(images[i], -imgW/2, -imgH/2, imgW, imgH)

        ctx.restore()
    }

    ctx.restore()
}

export const spinImages = (canvas, callback, args) => {
    let opts = opts = {
        images: [],
        sound: null,
        imgSize: 100,
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

    imgH = opts.imgSize
    imgW = opts.imgSize

    animate()
}