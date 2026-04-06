import React from 'react'

export default function ResultBanner({ value, onDismiss }) {
  if (value === null) return null

  return (
    <div className="result-overlay" onClick={onDismiss}>
      <div className="result-banner" onClick={(e) => e.stopPropagation()}>
        <div className="result-glow" />
        <div className="result-dice-icon">🎰</div>
        <h2 className="result-number">{value}</h2>
        <p className="result-subtitle">has been rolled!</p>
        <button className="osrs-btn result-dismiss" onClick={onDismiss}>
          Pull Again
        </button>
      </div>
    </div>
  )
}
