// @title 静默计时
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'

const PRESETS = [15, 25, 45, 60]

export default function Timer() {
  const [minutes, setMinutes] = useState(25)
  const [leftSec, setLeftSec] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = setInterval(() => {
      setLeftSec((s) => {
        if (s <= 1) {
          setRunning(false)
          setFinished(true)
          Taro.vibrateLong().catch(() => {})
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [running])

  function pick(m: number) {
    if (running) return
    setMinutes(m)
    setLeftSec(m * 60)
    setFinished(false)
  }

  function toggle() {
    if (finished) {
      setLeftSec(minutes * 60)
      setFinished(false)
    }
    setRunning((r) => !r)
  }

  function reset() {
    setRunning(false)
    setFinished(false)
    setLeftSec(minutes * 60)
  }

  const mm = String(Math.floor(leftSec / 60)).padStart(2, '0')
  const ss = String(leftSec % 60).padStart(2, '0')
  const progress = minutes * 60 > 0 ? 1 - leftSec / (minutes * 60) : 0

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-6">
      {/* 声明 */}
      <div className="rounded-sketch bg-muted border-2 border-dashed border-border/50 px-4 py-3 flex items-start gap-2">
        <div className="i-lucide-shield w-6 h-6 text-primary shrink-0 mt-0.5" />
        <p className="text-lg text-muted-foreground leading-relaxed">这里的时间不会进地图，也不会进看板。它只是一段安静。</p>
      </div>

      {/* 计时盘 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative w-56 h-56 rounded-full border-[6px] border-border/30 bg-card shadow-sketch flex items-center justify-center">
          {/* 进度弧 */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(hsl(var(--primary)) ${progress * 360}deg, transparent ${progress * 360}deg)`,
              maskImage: 'radial-gradient(transparent 62%, black 63%)',
              WebkitMaskImage: 'radial-gradient(transparent 62%, black 63%)',
            }}
          />
          <div className="flex flex-col items-center gap-1 z-10">
            <span className="text-6xl font-hand text-foreground tabular-nums">{finished ? '安了' : `${mm}:${ss}`}</span>
            {!finished && <span className="text-base text-muted-foreground">{running ? '静默中…' : '准备开始'}</span>}
            {finished && <span className="text-base text-muted-foreground">这一段时间只属于你</span>}
          </div>
        </div>

        {/* 时长选择 */}
        {!running && !finished && (
          <div className="flex gap-2">
            {PRESETS.map((m) => {
              const selected = m === minutes
              return (
                <button key={m} type="button" className={`press-sketch rounded-sketch border-2 w-16 py-2 ${selected ? 'bg-primary border-primary' : 'bg-card border-border/40'}`} onClick={() => pick(m)}>
                  <span className={`text-lg ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{m} 分</span>
                </button>
              )
            })}
          </div>
        )}

        {/* 控制 */}
        <div className="flex gap-3">
          <button type="button" className="press-sketch rounded-sketch bg-primary shadow-sketch px-8" onClick={toggle}>
            <div className="py-3 text-2xl text-primary-foreground font-hand">{running ? '停一停' : finished ? '再来一段' : '开始静默'}</div>
          </button>
          {!running && !finished && leftSec !== minutes * 60 && (
            <button type="button" className="press-sketch rounded-sketch bg-muted border-2 border-border/40 px-6" onClick={reset}>
              <div className="py-3 text-lg text-foreground">重置</div>
            </button>
          )}
        </div>
      </div>

      {/* 结束后回到地图记一笔 */}
      {finished && (
        <div className="rounded-sketch bg-card border-2 border-primary shadow-sketch p-4 flex flex-col gap-3 animate-sketch-in mb-6">
          <p className="text-xl text-foreground font-hand">这段安静结束了</p>
          <p className="text-base text-muted-foreground">如果这段时间里做成了什么，回地图记一笔吧</p>
          <button type="button" className="press-sketch rounded-sketch bg-primary" onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
            <div className="py-2.5 text-xl text-primary-foreground">回地图记一笔</div>
          </button>
        </div>
      )}
    </div>
  )
}
