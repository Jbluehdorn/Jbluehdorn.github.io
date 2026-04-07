import React from 'react'
import { WheelType } from '../data/constants'

export default function WinnerBanner({ winner, wheelType, onDismiss }) {
  if (!winner) return null

  const glowColor = winner.color || '#ffd700'

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
        <h2 className="winner-name" style={{ color: glowColor, textShadow: `0 0 15px ${glowColor}80, 0 0 30px ${glowColor}40` }}>{winner.name}</h2>
        <p className="winner-subtitle">{subtitle}</p>
        <button className="osrs-btn winner-dismiss" onClick={onDismiss}>
          Spin Again
        </button>
      </div>
    </div>
  )
}
