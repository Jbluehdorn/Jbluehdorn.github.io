let originalFont
let h
let w
let ctx
let start
let num = 3
let rAF
let velocity = 1
let curVelocity = velocity
let cb

const animate = () => {
    rAF = requestAnimationFrame(animate)

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
            cb()
            return
        }
    } else {
        const curFontSize = parseInt(ctx.font.split(' ')[0])
        const newFont = curFontSize - curVelocity
        curVelocity *= .85

        ctx.font = `${newFont}px ${ctx.font.split(' ')[1]}`
    }

    ctx.fillText(num.toString(), w/2, h/2 + parseInt(ctx.font.split(' ')[0])/2)
}

export const countdown = (canvas, callback, opts = {
    font: '75px Helvetica',
    fillStyle: '#FFD700'
}) => {
    cb = callback

    ctx = canvas.getContext('2d')
    h = canvas.height
    w = canvas.width
    originalFont = opts.font

    start = Date.now()

    ctx.textBaseLine = 'middle'
    ctx.textAlign = 'center'

    ctx.font = opts.font
    ctx.fillStyle = opts.fillStyle

    ctx.fillText('3', w / 2, h / 2)
    
    animate()
}
