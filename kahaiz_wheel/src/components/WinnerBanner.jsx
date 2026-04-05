import React from 'react'

export default function WinnerBanner({ winner, onDismiss }) {
  if (!winner) return null

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
        <p className="winner-subtitle">has been chosen!</p>
        <button className="osrs-btn winner-dismiss" onClick={onDismiss}>
          Spin Again
        </button>
      </div>
    </div>
  )
}
