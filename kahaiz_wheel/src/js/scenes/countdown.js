let originalFont
let h
let w
let ctx
let start
let num
let rAF
let velocity
let curVelocity
let cb
let audio

// Throttling controls
const fps = 60
let fpsInterval, now, then, elapsed

const animate = () => {
    rAF = requestAnimationFrame(animate)

    // calc time since last loop
    now = Date.now()
    elapsed = now - then

    // if enough time has passed, draw the next frame
    if( elapsed > fpsInterval ) {
        then = now - (elapsed % fpsInterval)

        // Clear the canvas
        ctx.clearRect(0, 0, w, h)

        // Check if the number has changed
        if(Date.now() - start > 1000) {
            start = Date.now()
            ctx.font = originalFont
            curVelocity = velocity
            num--

            if(num === 0) {
                cancelAnimationFrame(rAF)
                ctx.clearRect(0, 0, w, h)
                typeof cb === 'function' && cb()
                return
            } else {
                audio && audio.play()
            }
        } else {
            const fontParts = ctx.font.split(' ')
            const curFontSize = parseInt(fontParts[fontParts.length - 2])
            const newFontSize = curFontSize - curVelocity
            curVelocity *= .85

            let newFont = ''
            for(let i = 0; i < fontParts.length - 2; i++) {
                newFont += fontParts[i] + ' '
            }
            newFont += `${Math.floor(newFontSize)}px ${fontParts[fontParts.length - 1]}`

            ctx.font = newFont
        }

        let fontParts = ctx.font.split(' ')

        ctx.fillText(num.toString(), w/2, h/2 + parseInt(fontParts[fontParts.length - 2])/2)
    }

}

export const countdown = (canvas, callback, args) => {
    let opts = {
        font: 'bold 75px arial',
        fillStyle: '#FFD700',
        audio: null,
        ...args
    }
    num = 3
    velocity = 1
    curVelocity = velocity

    cb = callback

    ctx = canvas.getContext('2d')
    h = canvas.height
    w = canvas.width
    originalFont = opts.font
    audio = opts.audio

    start = Date.now()

    ctx.textBaseLine = 'middle'
    ctx.textAlign = 'center'

    ctx.font = opts.font
    ctx.fillStyle = opts.fillStyle

    ctx.fillText('3', w / 2, h / 2)

    audio && audio.play()

    fpsInterval = 1000 / fps
    then = Date.now()
    
    animate()
}
