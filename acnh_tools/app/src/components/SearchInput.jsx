import { useState, useRef, useEffect } from 'react'
import './SearchInput.css'

export default function SearchInput({
  items = [],
  onSelect,
  placeholder = 'Search...',
  renderSuggestion,
  filterFn,
  disabled = false,
}) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  const normalize = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const filtered = query.trim()
    ? items.filter(item =>
        filterFn
          ? filterFn(item, query)
          : normalize(item.name).startsWith(normalize(query))
      )
    : []

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (item) => {
    onSelect(item)
    setQuery('')
    setShowSuggestions(false)
    setActiveIndex(-1)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (!showSuggestions || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(prev => (prev <= 0 ? filtered.length - 1 : prev - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(filtered[activeIndex])
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="search-input-wrapper" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setShowSuggestions(true)
          setActiveIndex(-1)
        }}
        onFocus={() => query.trim() && setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {showSuggestions && filtered.length > 0 && (
        <ul className="search-suggestions" role="listbox">
          {filtered.slice(0, 20).map((item, i) => (
            <li
              key={item.name || i}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'active' : ''}
              onMouseDown={() => handleSelect(item)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {renderSuggestion ? renderSuggestion(item) : item.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
