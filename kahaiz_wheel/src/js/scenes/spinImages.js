let cb, ctx, h, w, cntrX, cntrY, images, imgCount, imgH, imgW, rAF

let loopCount = 0, dScale = 1

const animate = () => {
    rAF = requestAnimationFrame(animate)

    if(loopCount >= 150) {
        ctx.restore()
        ctx.fillRect(0, 0, w, h)
        ctx.clearRect(0, 0, w, h)
        cancelAnimationFrame(rAF)
        cb()
        return
    }

    if(loopCount < 75) {
        drawImages()
        loopCount++
        return
    }

    //clear the canvas 
    ctx.restore()
    ctx.clearRect(-2, -2, w + 2, h + 2)

    ctx.translate(cntrX, cntrY)
    ctx.rotate(1 * Math.PI / 180)
    ctx.translate(-cntrX, -cntrY)

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

export const spinImages = (canvas, callback, opts = {
    images: []
}) => {
    cb = callback

    ctx = canvas.getContext('2d')
    h = canvas.height
    w = canvas.width
    cntrX = w / 2
    cntrY = h / 2

    ctx.textBaseLine = 'middle'
    ctx.textAlign = 'center'

    images = opts.images
    imgCount = images.length

    // imgH = h/imgCount
    // imgW = w/imgCount
    imgH = 150
    imgW = 150

    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    // ctx.translate(cntrX, cntrY)

    animate()
}