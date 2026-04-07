import { useRef, useState, useCallback, useEffect } from 'react'

export const FOUND_SONGS = [
  { id: 'random', label: '🎲 Random' },
  { id: 'none', label: '🔇 None' },
  { id: 'King_has_Come_(King\'s_Ransom).ogg', label: "King has Come (King's Ransom)" },
  { id: 'Quest_Complete_1.ogg', label: 'Quest Complete' },
  { id: 'Treasure!_(Treasure_Trails).ogg', label: 'Treasure! (Treasure Trails)' },
  { id: "Verzik's_Defeat.ogg", label: "Verzik's Defeat" },
  { id: 'You_Are_Dead!.ogg', label: 'You Are Dead!' },
]

export const MUSIC_SONGS = [
  { id: 'random', label: '🎲 Random' },
  { id: 'none', label: '🔇 None' },
  { id: 'Contest.ogg', label: 'Contest' },
  { id: "Evil_Bob's_Island.ogg", label: "Evil Bob's Island" },
  { id: 'Gnomeball.ogg', label: 'Gnomeball' },
  { id: 'Grid_Master_tile_(R7T7).ogg', label: 'Grid Master' },
  { id: 'In_the_Pits.ogg', label: 'In the Pits' },
  { id: 'Inferno.ogg', label: 'Inferno' },
  { id: 'Pinball_Wizard.ogg', label: 'Pinball Wizard' },
  { id: 'Royale.ogg', label: 'Royale' },
  { id: 'Sea_Shanty_2.ogg', label: 'Sea Shanty 2' },
  { id: 'Song_of_the_Elves.ogg', label: 'Song of the Elves' },
  { id: 'The Price is Right theme song.mp3', label: 'The Price is Right' },
  { id: 'Yo_Ho_Ho!.ogg', label: 'Yo Ho Ho!' },
]

const STORAGE_KEY = 'kahaiz_audio_prefs'

const DEFAULTS = {
  muted: false,
  tickVolume: 0.8,
  foundVolume: 0.8,
  musicVolume: 0.6,
  foundSong: 'random',
  musicSong: 'random',
}

function loadPrefs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULTS, ...JSON.parse(stored) }
  } catch {}
  return { ...DEFAULTS }
}

function savePrefs(prefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

function pickRandom(songs) {
  const playable = songs.filter((s) => s.id !== 'random' && s.id !== 'none')
  return playable[Math.floor(Math.random() * playable.length)].id
}

export function useAudio() {
  const [prefs, setPrefs] = useState(loadPrefs)
  const tickRef = useRef(null)
  const foundRef = useRef(null)
  const musicRef = useRef(null)
  const musicWasPausedForFound = useRef(false)
  const musicStartedRef = useRef(false)
  const [currentMusicName, setCurrentMusicName] = useState(null)
  const [musicPlaying, setMusicPlaying] = useState(false)
  const previewRef = useRef(null)

  // Persist prefs
  useEffect(() => { savePrefs(prefs) }, [prefs])

  // Preload tick sound
  useEffect(() => {
    const tick = new Audio('./assets/audio/locked.mp3')
    tick.preload = 'auto'
    tick.load()
    tickRef.current = tick
  }, [])

  // Effective volume helpers (0 when muted)
  const effectiveVol = useCallback((vol) => prefs.muted ? 0 : vol, [prefs.muted])

  // --- Music management ---
  const musicHistoryRef = useRef([])
  const musicHistoryIndexRef = useRef(-1)

  const stopMusic = useCallback(() => {
    if (musicRef.current) {
      musicRef.current.pause()
      musicRef.current.currentTime = 0
      musicRef.current = null
    }
    musicStartedRef.current = false
    setCurrentMusicName(null)
    setMusicPlaying(false)
  }, [])

  const playMusicById = useCallback((songId) => {
    if (musicRef.current) {
      musicRef.current.pause()
      musicRef.current = null
    }
    if (songId === 'none') return

    const song = MUSIC_SONGS.find((s) => s.id === songId)
    setCurrentMusicName(song ? song.label : null)

    const audio = new Audio(`./assets/audio/music/${songId}`)
    audio.loop = prefs.musicSong !== 'random'
    audio.volume = effectiveVol(prefs.musicVolume)
    audio.preload = 'auto'

    // When random and song ends, auto-advance to next random track
    if (prefs.musicSong === 'random') {
      audio.onended = () => {
        const nextId = pickRandom(MUSIC_SONGS)
        musicHistoryRef.current.push(nextId)
        musicHistoryIndexRef.current = musicHistoryRef.current.length - 1
        playMusicById(nextId)
      }
    }

    musicRef.current = audio
    musicStartedRef.current = true
    setMusicPlaying(true)
    audio.play().catch(() => {})
  }, [prefs.musicSong, prefs.musicVolume, prefs.muted, effectiveVol])

  const startMusic = useCallback(() => {
    stopMusic()
    const songId = prefs.musicSong === 'random' ? pickRandom(MUSIC_SONGS) : prefs.musicSong
    if (songId === 'none') return

    musicHistoryRef.current = [songId]
    musicHistoryIndexRef.current = 0
    playMusicById(songId)
  }, [prefs.musicSong, stopMusic, playMusicById])

  const skipMusic = useCallback(() => {
    const nextId = prefs.musicSong === 'random' ? pickRandom(MUSIC_SONGS) : prefs.musicSong
    if (nextId === 'none') return
    musicHistoryRef.current.push(nextId)
    musicHistoryIndexRef.current = musicHistoryRef.current.length - 1
    playMusicById(nextId)
  }, [prefs.musicSong, playMusicById])

  const prevMusic = useCallback(() => {
    if (musicHistoryIndexRef.current > 0) {
      musicHistoryIndexRef.current--
      const prevId = musicHistoryRef.current[musicHistoryIndexRef.current]
      playMusicById(prevId)
    }
  }, [playMusicById])

  // Start music on first user interaction
  const ensureMusicStarted = useCallback(() => {
    if (!musicStartedRef.current && prefs.musicSong !== 'none') {
      startMusic()
    }
  }, [startMusic, prefs.musicSong])

  // Autoplay music on mount; fall back to first interaction if browser blocks it
  useEffect(() => {
    if (prefs.musicSong === 'none') return

    const tryAutoplay = () => {
      if (musicStartedRef.current) return
      startMusic()
    }

    tryAutoplay()

    // Fallback: if autoplay was blocked, start on first user gesture
    const onInteraction = () => {
      if (!musicStartedRef.current && prefs.musicSong !== 'none') {
        startMusic()
      }
      cleanup()
    }
    const cleanup = () => {
      document.removeEventListener('pointerdown', onInteraction)
      document.removeEventListener('keydown', onInteraction)
    }
    document.addEventListener('pointerdown', onInteraction, { once: true })
    document.addEventListener('keydown', onInteraction, { once: true })
    return cleanup
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update music volume live
  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = effectiveVol(prefs.musicVolume)
    }
  }, [prefs.musicVolume, prefs.muted, effectiveVol])

  // Restart music when song selection changes (only if already playing)
  useEffect(() => {
    if (musicStartedRef.current) {
      startMusic()
    }
  }, [prefs.musicSong]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMusic = useCallback(() => {
    if (!musicRef.current || musicRef.current.paused) {
      if (musicRef.current) {
        musicRef.current.play().catch(() => {})
        setMusicPlaying(true)
      } else {
        startMusic()
      }
    } else {
      musicRef.current.pause()
      setMusicPlaying(false)
    }
  }, [startMusic])

  // --- Tick ---
  const playTick = useCallback(() => {
    if (prefs.muted || !tickRef.current) return
    const tick = tickRef.current.cloneNode()
    tick.volume = prefs.tickVolume
    tick.play().catch(() => {})
  }, [prefs.muted, prefs.tickVolume])

  // --- Found ---
  const playFound = useCallback(() => {
    if (prefs.muted) return
    const songId = prefs.foundSong === 'random' ? pickRandom(FOUND_SONGS) : prefs.foundSong
    if (songId === 'none') return

    // Duck music volume instead of pausing (avoids browser autoplay restrictions on resume)
    if (musicRef.current && !musicRef.current.paused) {
      musicRef.current.volume = 0
      musicWasPausedForFound.current = true
    }

    // Stop any previous found sound
    if (foundRef.current) {
      foundRef.current.pause()
      foundRef.current = null
    }

    const audio = new Audio(`./assets/audio/found/${songId}`)
    audio.volume = effectiveVol(prefs.foundVolume)
    audio.preload = 'auto'
    audio.onended = () => {
      foundRef.current = null
      if (musicWasPausedForFound.current && musicRef.current) {
        musicRef.current.volume = effectiveVol(prefs.musicVolume)
        musicWasPausedForFound.current = false
      }
    }
    foundRef.current = audio
    audio.play().catch(() => {})
  }, [prefs.muted, prefs.foundSong, prefs.foundVolume, prefs.musicVolume, effectiveVol])

  const dismissFound = useCallback(() => {
    if (foundRef.current) {
      foundRef.current.pause()
      foundRef.current = null
    }
    if (musicWasPausedForFound.current && musicRef.current) {
      musicRef.current.volume = effectiveVol(prefs.musicVolume)
      musicWasPausedForFound.current = false
    }
  }, [prefs.musicVolume, effectiveVol])

  const previewFound = useCallback(() => {
    // Stop any existing preview
    if (previewRef.current) {
      previewRef.current.pause()
      previewRef.current = null
    }
    const songId = prefs.foundSong === 'random' ? pickRandom(FOUND_SONGS) : prefs.foundSong
    if (songId === 'none') return

    // Duck music during preview
    if (musicRef.current && !musicRef.current.paused && musicRef.current.volume > 0) {
      musicRef.current.volume = 0
      musicWasPausedForFound.current = true
    }

    const audio = new Audio(`./assets/audio/found/${songId}`)
    audio.volume = effectiveVol(prefs.foundVolume)
    audio.onended = () => {
      previewRef.current = null
      if (musicWasPausedForFound.current && musicRef.current) {
        musicRef.current.volume = effectiveVol(prefs.musicVolume)
        musicWasPausedForFound.current = false
      }
    }
    previewRef.current = audio
    audio.play().catch(() => {})
  }, [prefs.foundSong, prefs.foundVolume, prefs.musicVolume, effectiveVol])

  // --- Setters ---
  const setMuted = useCallback((muted) => {
    setPrefs((p) => ({ ...p, muted }))
  }, [])
  const toggleMute = useCallback(() => {
    setPrefs((p) => ({ ...p, muted: !p.muted }))
  }, [])
  const setTickVolume = useCallback((v) => setPrefs((p) => ({ ...p, tickVolume: v })), [])
  const setFoundVolume = useCallback((v) => setPrefs((p) => ({ ...p, foundVolume: v })), [])
  const setMusicVolume = useCallback((v) => setPrefs((p) => ({ ...p, musicVolume: v })), [])
  const setFoundSong = useCallback((id) => setPrefs((p) => ({ ...p, foundSong: id })), [])
  const setMusicSong = useCallback((id) => setPrefs((p) => ({ ...p, musicSong: id })), [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (musicRef.current) { musicRef.current.pause(); musicRef.current = null }
      if (foundRef.current) { foundRef.current.pause(); foundRef.current = null }
    }
  }, [])

  return {
    prefs,
    currentMusicName,
    musicPlaying,
    playTick,
    playFound,
    previewFound,
    dismissFound,
    startMusic,
    stopMusic,
    skipMusic,
    prevMusic,
    toggleMusic,
    ensureMusicStarted,
    toggleMute,
    setMuted,
    setTickVolume,
    setFoundVolume,
    setMusicVolume,
    setFoundSong,
    setMusicSong,
  }
}
