import React, { useRef, useEffect } from 'react'
import { EpisodeTypeColors } from '../data/constants'

const TAPES_PER_ROW = 10

export default function TapeShelf({ episodes, highlightId, selectedId }) {
  const selectedRef = useRef(null)

  // Scroll the selected tape into view
  useEffect(() => {
    if (selectedId && selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedId])

  // Also scroll the highlight into view during fast selection
  const highlightRef = useRef(null)
  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' })
    }
  }, [highlightId])

  if (episodes.length === 0) {
    return <div className="shelf-empty">No episodes loaded</div>
  }

  // Split into rows/shelves
  const rows = []
  for (let i = 0; i < episodes.length; i += TAPES_PER_ROW) {
    rows.push(episodes.slice(i, i + TAPES_PER_ROW))
  }

  return (
    <div className="shelves">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="shelf">
          <div className="shelf-tapes">
            {row.map((ep) => {
              const isHighlighted = highlightId === ep.id
              const isSelected = selectedId === ep.id
              const spineColor = EpisodeTypeColors[ep.type] || '#555'

              return (
                <div
                  key={ep.id}
                  ref={isSelected ? selectedRef : isHighlighted ? highlightRef : null}
                  className={`tape ${isHighlighted ? 'tape-highlight' : ''} ${isSelected ? 'tape-selected' : ''}`}
                >
                  <div className="tape-spine" style={{ background: spineColor }} />
                  <div className="tape-face">
                    {ep.thumbnail ? (
                      <img
                        src={ep.thumbnail}
                        alt={ep.title}
                        className="tape-thumb"
                        draggable={false}
                        loading="lazy"
                      />
                    ) : (
                      <div className="tape-thumb tape-thumb-placeholder" />
                    )}
                    <div className="tape-title">{cleanTitle(ep.title)}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="shelf-board" />
        </div>
      ))}
    </div>
  )
}

function cleanTitle(title) {
  let t = title || ''
  t = t.replace(/^Best of the Worst:\s*/i, '')
  t = t.replace(/\s*-\s*Best of the Worst$/i, '')
  if (t.length > 35) t = t.slice(0, 33) + '…'
  return t
}
