import React from 'react'
import { WheelType } from '../data/constants'

export default function WinnerBanner({ winner, wheelType, onDismiss }) {
  if (!winner) return null

  const subtitle =
    wheelType === WheelType.BOTW
      ? 'is the Boss of the Week!'
      : wheelType === WheelType.SOTW
        ? 'is the Skill of the Week!'
        : 'has been chosen!'

  return (
    <div className="winner-overlay" onClick={onDismiss}>
      <div className="winner-banner" onClick={(e) => e.stopPropagation()}>
        <div className="winner-glow" />
        <img
          src={`./assets/img/${winner.filename}`}
          alt={winner.name}
          className="winner-image"
        />
        <h2 className="winner-name">{winner.name}</h2>
        <p className="winner-subtitle">{subtitle}</p>
        <button className="osrs-btn winner-dismiss" onClick={onDismiss}>
          Spin Again
        </button>
      </div>
    </div>
  )
}
