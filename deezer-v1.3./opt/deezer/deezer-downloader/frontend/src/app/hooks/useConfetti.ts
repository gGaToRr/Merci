import { useEffect } from 'react'

const CONFETTI_KEY = 'confetti_last_shown'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function launchConfetti() {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999'
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')!
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const colors = ['#14b8a6','#3b82f6','#8b5cf6','#f59e0b','#ec4899','#10b981','#06b6d4','#f97316']
  const pieces: {
    x: number; y: number; vx: number; vy: number
    color: string; size: number; rot: number; rotSpeed: number; shape: 'rect'|'circle'|'star'
  }[] = []

  for (let i = 0; i < 180; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 400,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 10,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      shape: (['rect','circle','star'] as const)[Math.floor(Math.random()*3)],
    })
  }

  let frame = 0
  const totalFrames = 260

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    pieces.forEach(p => {
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.fillStyle = p.color
      ctx.globalAlpha = Math.max(0, 1 - frame / totalFrames)
      if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else if (p.shape === 'star') {
        ctx.beginPath()
        for (let j = 0; j < 5; j++) {
          const angle = (j * 4 * Math.PI) / 5 - Math.PI / 2
          const r = j % 2 === 0 ? p.size / 2 : p.size / 4
          j === 0 ? ctx.moveTo(Math.cos(angle)*r, Math.sin(angle)*r) : ctx.lineTo(Math.cos(angle)*r, Math.sin(angle)*r)
        }
        ctx.closePath(); ctx.fill()
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      }
      ctx.restore()
      p.x += p.vx; p.y += p.vy; p.rot += p.rotSpeed
      p.vx *= 0.99; p.vy += 0.08
    })
    frame++
    if (frame < totalFrames) requestAnimationFrame(draw)
    else canvas.remove()
  }
  draw()
}

export function useConfetti() {
  useEffect(() => {
    try {
      const last = localStorage.getItem(CONFETTI_KEY)
      if (!last || Date.now() - parseInt(last) > SEVEN_DAYS_MS) {
        // Petit délai pour laisser la page se rendre
        const t = setTimeout(() => {
          launchConfetti()
          localStorage.setItem(CONFETTI_KEY, Date.now().toString())
        }, 800)
        return () => clearTimeout(t)
      }
    } catch {}
  }, [])
}
