import React from 'react'
import { WheelType } from '../data/constants'

export default function WinnerBanner({ winner, wheelType, onDismiss }) {
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

  return (
    <div className="winner-overlay" onClick={onDismiss}>
      <div className="winner-banner" onClick={(e) => e.stopPropagation()}>
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
  )
}
