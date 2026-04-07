import React from 'react'
import { EpisodeTypeLabels, EpisodeTypeColors } from '../data/constants'

export default function WinnerBanner({ winner, onDismiss }) {
  if (!winner) return null

  const typeColor = EpisodeTypeColors[winner.type] || '#cc0000'
  const typeLabel = EpisodeTypeLabels[winner.type] || 'Episode'

  return (
    <div className="winner-overlay" onClick={onDismiss}>
      <div className="winner-banner" onClick={(e) => e.stopPropagation()}>
        <div
          className="winner-glow"
          style={{
            background: `radial-gradient(circle, ${typeColor}50 0%, ${typeColor}20 40%, transparent 70%)`,
          }}
        />
        {winner.thumbnail && (
          <img
            src={winner.thumbnail}
            alt={winner.title}
            className="winner-image"
            crossOrigin="anonymous"
            style={{
              filter: `drop-shadow(0 0 15px ${typeColor}80) drop-shadow(0 0 30px ${typeColor}40)`,
            }}
          />
        )}
        <span className="winner-type-badge" style={{ background: typeColor }}>
          {typeLabel}
        </span>
        <h2
          className="winner-name"
          style={{
            color: '#fff',
            textShadow: `0 0 15px ${typeColor}80, 0 0 30px ${typeColor}40`,
          }}
        >
          {winner.title}
        </h2>
        <p className="winner-subtitle">has been chosen!</p>
        <div className="winner-actions">
          <a
            href={winner.url}
            target="_blank"
            rel="noopener noreferrer"
            className="winner-btn watch-btn"
          >
            ▶ Watch on YouTube
          </a>
          <button className="winner-btn spin-again-btn" onClick={onDismiss}>
            Spin Again
          </button>
        </div>
      </div>
    </div>
  )
}
