"use client"

// Chime player + mute toggle for the support surface. The audio file
// lives at /public/sounds/support-ping.wav. We lazy-instantiate the
// HTMLAudioElement on first play and reuse it across calls so the
// browser doesn't re-decode every chime.

const SOUND_SRC = "/sounds/support-ping.wav"
const MUTE_KEY = "support-sound-muted"

let audio: HTMLAudioElement | null = null

function getAudio(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null
  if (audio) return audio
  audio = new Audio(SOUND_SRC)
  audio.volume = 0.5
  audio.preload = "auto"
  return audio
}

export function playSupportChime(): void {
  if (typeof window === "undefined") return
  // Respect OS reduced-motion + per-user mute. Browsers also block
  // .play() unless the user has interacted with the page; we catch
  // and ignore that — the visual badges still reflect the new
  // message even when the chime is silent.
  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    isMuted()
  )
    return
  const a = getAudio()
  if (!a) return
  // Re-seek to 0 so back-to-back chimes overlap cleanly rather than
  // queue (default play() on an in-progress audio is a no-op).
  try {
    a.currentTime = 0
  } catch {
    // Some browsers throw on currentTime= until enough metadata loads;
    // the next play() will still trigger from wherever it is.
  }
  void a.play().catch(() => {})
}

export function isMuted(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(MUTE_KEY) === "1"
  } catch {
    return false
  }
}

export function setMuted(muted: boolean): void {
  if (typeof window === "undefined") return
  try {
    if (muted) localStorage.setItem(MUTE_KEY, "1")
    else localStorage.removeItem(MUTE_KEY)
  } catch {
    // Private mode / storage disabled — no-op. Mute reverts to default
    // (unmuted) on next page load.
  }
  // Notify listeners (e.g. the toggle button) — localStorage events
  // don't fire on the same tab that wrote the value.
  for (const fn of muteListeners) fn(muted)
}

const muteListeners = new Set<(muted: boolean) => void>()

export function onMuteChange(fn: (muted: boolean) => void): () => void {
  muteListeners.add(fn)
  return () => muteListeners.delete(fn)
}
