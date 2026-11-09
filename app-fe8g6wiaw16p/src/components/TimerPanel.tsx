// 静默计时面板 —— 可选插件，数据仅本地保存，不进地图/看板/回声
import { useEffect, useRef, useState } from 'react'
import Taro from '@tarojs/taro'

const PRESETS = [15, 25, 45, 60]

interface Props {
  open: boolean
  onClose: () => void
}

export default function TimerPanel({ open, onClose }: Props) {
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

  // 面板关闭时停止计时
  useEffect(() => {
    if (!open && timerRef.current) {
      clearInterval(timerRef.current)
      setRunning(false)
    }
  }, [open])

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative w-full glass-strong rounded-t-sketch-lg p-5 flex flex-col gap-4 animate-sketch-in">
        {/* 顶部固定声明 */}
        <div className="rounded-sketch bg-muted border border-dashed border-border/60 px-4 py-2 flex items-center gap-2">
          <div className="i-lucide-shield w-5 h-5 text-primary shrink-0" />
          <p className="text-base text-muted-foreground">这里的时间不进地图</p>
        </div>

        {/* 计时盘 */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-44 h-44 rounded-full border-[5px] border-border/30 bg-card shadow-sketch flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: `conic-gradient(hsl(var(--primary)) ${progress * 360}deg, transparent ${progress * 360}deg)`,
                maskImage: 'radial-gradient(transparent 62%, black 63%)',
                WebkitMaskImage: 'radial-gradient(transparent 62%, black 63%)',
              }}
            />
            <div className="flex flex-col items-center gap-1 z-10">
              <span className="text-5xl font-hand text-foreground tabular-nums">{finished ? '安了' : `${mm}:${ss}`}</span>
              <span className="text-base text-muted-foreground">{finished ? '这一段时间只属于你' : running ? '静默中…' : '准备开始'}</span>
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
              <div className="py-3 text-xl text-primary-foreground font-hand">{running ? '停一停' : finished ? '再来一段' : '开始静默'}</div>
            </button>
            {!running && !finished && leftSec !== minutes * 60 && (
              <button type="button" className="press-sketch rounded-sketch bg-muted border-2 border-border/40 px-6" onClick={reset}>
                <div className="py-3 text-lg text-foreground">重置</div>
              </button>
            )}
          </div>
        </div>

        {/* 结束后回地图记一笔 */}
        {finished && (
          <div className="rounded-sketch bg-card border border-primary shadow-sketch-sm p-3 flex flex-col gap-2 animate-sketch-in">
            <p className="text-lg text-foreground font-hand">这段安静结束了</p>
            <p className="text-base text-muted-foreground">如果做成了什么，回地图记一笔吧（时间不会自动记入）</p>
          </div>
        )}

        {/* 关闭 */}
        <button type="button" className="press-sketch rounded-sketch bg-muted border border-border/40" onClick={onClose}>
          <div className="py-2.5 text-lg text-foreground">收起计时</div>
        </button>
      </div>
    </div>
  )
}
