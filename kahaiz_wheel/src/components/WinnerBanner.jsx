import React, { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { WheelType } from '../data/constants'

export default function WinnerBanner({ winner, wheelType, onDismiss }) {
  const bannerRef = useRef(null)
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!winner) return null

  const baseColor = winner.color || '#ffd700'

  // Ensure the text color is bright enough to read against dark background
  const r = parseInt(baseColor.slice(1, 3), 16)
  const g = parseInt(baseColor.slice(3, 5), 16)
  const b = parseInt(baseColor.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const minBrightness = 0.45
  const boost = luminance < minBrightness ? minBrightness / Math.max(luminance, 0.05) : 1
  const textColor = `rgb(${Math.min(255, Math.round(r * boost))}, ${Math.min(255, Math.round(g * boost))}, ${Math.min(255, Math.round(b * boost))})`
  const glowColor = baseColor

  const subtitle =
    wheelType === WheelType.BOTW
      ? 'is the Boss of the Week!'
      : wheelType === WheelType.SOTW
        ? 'is the Skill of the Week!'
        : 'has been chosen!'

  const handleCopyScreenshot = async (e) => {
    if (!bannerRef.current) return
    e.currentTarget.blur()
    setCopying(true)
    const banner = bannerRef.current
    try {
      const canvas = await html2canvas(banner, {
        useCORS: true,
        backgroundColor: '#0e0e08',
        onclone: (_document, clonedBanner) => {
          // Cloning restarts popIn. Stop it before html2canvas reads its transient opacity/scale.
          for (const element of [clonedBanner, ...clonedBanner.querySelectorAll('*')]) {
            element.style.animation = 'none'
          }
          clonedBanner.style.boxShadow = 'none'
          clonedBanner.querySelector('.winner-glow').style.visibility = 'hidden'
          clonedBanner.querySelector('.winner-actions').style.display = 'none'

          // html2canvas ignores object-fit: contain; express the same image box with padding.
          const image = clonedBanner.querySelector('.winner-image')
          if (image.naturalWidth && image.naturalHeight) {
            const { width, height } = image.getBoundingClientRect()
            const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
            image.style.padding = `${(height - image.naturalHeight * scale) / 2}px ${(width - image.naturalWidth * scale) / 2}px`
          }
        },
      })
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => {
          if (result) resolve(result)
          else reject(new Error('Screenshot PNG encoding failed'))
        }, 'image/png')
      })
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy screenshot:', err)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="winner-overlay" onClick={onDismiss}>
      <div className="winner-banner" ref={bannerRef} onClick={(e) => e.stopPropagation()}>
        <div
          className="winner-glow"
          style={{
            background: `radial-gradient(circle, ${glowColor}40 0%, ${glowColor}15 40%, transparent 70%)`,
          }}
        />
        <img
          src={`./assets/img/${winner.filename}`}
          alt={winner.name}
          className="winner-image"
          style={{
            filter: `drop-shadow(0 0 15px ${glowColor}80) drop-shadow(0 0 30px ${glowColor}40)`,
          }}
        />
        <h2 className="winner-name" style={{ color: textColor, textShadow: `0 0 15px ${glowColor}80, 0 0 30px ${glowColor}40` }}>{winner.name}</h2>
        <p className="winner-subtitle">{subtitle}</p>
        <div className="winner-actions">
          <button
            className="osrs-btn winner-copy"
            onClick={handleCopyScreenshot}
            disabled={copying}
            title="Copy screenshot to clipboard"
          >
            {copied ? '✓ Copied!' : copying ? 'Copying...' : '📋 Copy'}
          </button>
          <button
            className="osrs-btn winner-dismiss"
            onClick={onDismiss}
            style={{
              background: `linear-gradient(180deg, ${glowColor}90 0%, ${glowColor}60 100%)`,
              color: '#fff',
              borderColor: textColor,
            }}
          >
            Spin Again
          </button>
        </div>
      </div>
    </div>
  )
}
