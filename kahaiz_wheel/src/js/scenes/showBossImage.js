let ctx, h, w, rAF, cb 
let image, name, txtScale, imgScale, imgH, imgW, loopCount, audioHasPlayed, audio

// Throttling controls
const fps = 60
let fpsInterval, now, then, elapsed

const animate = () => {
    rAF = requestAnimationFrame(animate)

    // calc time since last loop
    now = Date.now()
    elapsed = now - then

    // if enough time has passed, draw the next frame
    if(elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval)

        //clear the current contents
        ctx.restore()
        
        if(loopCount >= 100) {
            cancelAnimationFrame(rAF)
            audioHasPlayed = false
            return
        }

        if(audio && !audioHasPlayed) {
            audioHasPlayed = true
            audio.play()
        }

        if(loopCount <= 10) {
            ctx.clearRect(0, 0, w, h)
            ctx.drawImage(
                image, 
                w / 2 - imgW * imgScale / 2, 
                h * imgScale / 2 - imgH / 2, 
                imgW * imgScale, 
                imgH * imgScale
            )
            imgScale *= 1.0075
        } else if (loopCount < 25) {
            ctx.clearRect(0, h/2 + 50, w, h)
            const curFontSize = parseInt(ctx.font.split(' ')[0])
            const newFont = curFontSize - 1
            txtScale *= 1.00001

            ctx.font = `${newFont}px ${ctx.font.split(' ')[1]}`

            ctx.fillText(name, w/2, h/2 + 125)
        } else {
            cancelAnimationFrame(rAF)
            ctx.restore()
            typeof cb === 'function' && cb()
            return
        }

        loopCount++
    }
}

export const showBossImage = (canvas, callback, args) => {
    let opts = {
        image: null,
        name: '',
        font: 'bold 60px Arial',
        fillStyle: '#FFFFFF',
        audio: null,
        ...args
    }
    loopCount = 0
    imgScale = .8
    txtScale = .8
    audioHasPlayed = false
    ctx = canvas.getContext('2d')

    h = canvas.height
    w = canvas.width

    imgH = 200
    imgW = 200

    cb = callback

    ctx.fillStyle = opts.fillStyle
    ctx.font = opts.font
    ctx.textBaseLine = 'middle'
    ctx.textAlign = 'center'
    ctx.save()

    image = opts.image
    name = opts.name
    audio = opts.audio

    fpsInterval = 1000 / fps
    then = Date.now()

    animate()
}