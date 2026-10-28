// 排期视图 —— 日/周视图 + 时间网格 + 拖动改计划（仅改计划，不产生完成记录）
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { ScrollView } from '@tarojs/components'
import { getMainlineDetail, updatePlan } from '@/db/api'
import type { MainlineDetail, NodeItem } from '@/db/types'
import { addDays, fmt, minutesToHM, parseDate, timeToMinutes, todayStr, weekStart, weekdayCN } from '@/utils/date'

interface Props {
  mainlineId: string
  onSwitchToMap: () => void
}

const HOUR_START = 7
const HOUR_END = 23
const ROWS = HOUR_END - HOUR_START
const ROW_H = 52
const HOUR_LABEL_W = 44
const DAY_W = 42
const GRID_TOP = 34

function nodeColor(n: NodeItem): string {
  if (n.weight === 'main') return 'bg-primary'
  if (n.weight === 'side') return 'bg-primary/60'
  return 'bg-accent/70'
}

export default function ScheduleView({ mainlineId }: Props) {
  const [mode, setMode] = useState<'day' | 'week'>('week')
  const [detail, setDetail] = useState<MainlineDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [curDate, setCurDate] = useState(todayStr())
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOffsets, setDragOffsets] = useState<Record<string, { day: number; startMin: number; endMin: number }>>({})

  const load = useCallback(async () => {
    if (!mainlineId) return
    setLoading(true)
    setError('')
    try {
      const d = await getMainlineDetail(mainlineId)
      setDetail(d)
    } catch {
      setError('排期加载失败')
    } finally {
      setLoading(false)
    }
  }, [mainlineId])

  useEffect(() => { load() }, [load])

  const ws = weekStart(curDate)
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(ws, i)), [ws])

  // 当前主线全部有计划时段的节点
  const plannedNodes = useMemo(() => {
    if (!detail) return []
    return detail.branches
      .filter((b) => b.type === 'subject' && b.status !== 'archived')
      .flatMap((b) => b.nodes.filter((n) => n.plan_date && n.plan_start && n.plan_end))
  }, [detail])

  function dayNodes(date: string): NodeItem[] {
    return plannedNodes.filter((n) => (dragOffsets[n.id] ? addDays(n.plan_date as string, dragOffsets[n.id].day) === date : n.plan_date === date))
  }

  function offsetOf(n: NodeItem) {
    return dragOffsets[n.id] ?? { day: 0, startMin: timeToMinutes(n.plan_start as string), endMin: timeToMinutes(n.plan_end as string) }
  }

  function topOf(n: NodeItem): number {
    const o = offsetOf(n)
    return GRID_TOP + ((o.startMin / 60 - HOUR_START) * ROW_H)
  }

  function heightOf(n: NodeItem): number {
    const o = offsetOf(n)
    return Math.max(((o.endMin - o.startMin) / 60) * ROW_H, 26)
  }

  // ---------- 拖动逻辑（触摸）：拖块身改时段与日期，拖底部把手改时长 ----------
  function onNodeDragStart(e: any, n: NodeItem, dayIdx: number, mode: 'move' | 'resize' = 'move') {
    const touch = e.changedTouches?.[0] ?? e.touches?.[0]
    if (!touch) return
    const o = offsetOf(n)
    const ctx = {
      day: dayIdx,
      startX: touch.clientX ?? 0,
      startY: touch.clientY ?? 0,
      startMin: o.startMin,
      endMin: o.endMin,
      startDay: o.day,
      mode,
    }
    ;(e.currentTarget as any).__drag = ctx
    setDragId(n.id)
    if (mode === 'resize') e.stopPropagation?.()
  }

  function onNodeDragMove(e: any, n: NodeItem) {
    const touch = e.changedTouches?.[0] ?? e.touches?.[0]
    const el = e.currentTarget as any
    const ctx = el.__drag
    if (!touch || !ctx) return
    const dy = (touch.clientY ?? 0) - ctx.startY
    const dx = (touch.clientX ?? 0) - ctx.startX
    const minDelta = Math.round((dy / ROW_H) * 60 / 15) * 15
    const dayDelta = ctx.mode === 'move' ? Math.round(dx / DAY_W) : 0
    setDragOffsets((prev) => {
      const base = prev[n.id] ?? { day: ctx.startDay, startMin: ctx.startMin, endMin: ctx.endMin }
      if (ctx.mode === 'resize') {
        return { ...prev, [n.id]: { day: base.day, startMin: ctx.startMin, endMin: clampMin(ctx.endMin + minDelta) } }
      }
      return {
        ...prev,
        [n.id]: {
          day: ctx.startDay + dayDelta,
          startMin: clampMin(ctx.startMin + minDelta),
          endMin: clampMin(ctx.endMin + minDelta),
        },
      }
    })
  }

  function clampMin(m: number): number {
    return Math.min(Math.max(m, HOUR_START * 60), HOUR_END * 60)
  }

  async function onNodeDragEnd(e: any, n: NodeItem) {
    const el = e.currentTarget as any
    const ctx = el.__drag
    setDragId(null)
    if (!ctx) { delete el.__drag; return }
    delete el.__drag
    const o = dragOffsets[n.id]
    if (!o) return
    const base = n.plan_date as string
    const newDate = addDays(base, o.day)
    const startMin = o.startMin
    const endMin = Math.max(o.endMin, startMin + 30)
    const payload = { plan_date: newDate, plan_start: minutesToHM(startMin), plan_end: minutesToHM(endMin) }
    try {
      await updatePlan(n.id, payload)
      Taro.showToast({ title: '计划已更新', icon: 'none' })
      await load()
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    }
  }

  // ---------- 布局 ----------
  const gridW = mode === 'week' ? HOUR_LABEL_W + DAY_W * 7 : HOUR_LABEL_W + 300

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xl text-muted-foreground">正在展开排期…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-8">
        <div className="i-lucide-calendar-off w-14 h-14 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">{error}</p>
        <button type="button" className="press-sketch rounded-sketch bg-primary px-6 py-2" onClick={() => load()}>
          <div className="py-1 text-xl text-primary-foreground">重试</div>
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 固定说明 */}
      <div className="mx-4 mt-2 rounded-sketch bg-muted px-4 py-2 border-2 border-border/30">
        <p className="text-base text-muted-foreground">这里排的是打算什么时候走；走完了回地图记一笔，不看用了多久。</p>
      </div>

      {/* 视图切换 + 日期切换 */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <div className="flex rounded-sketch border-2 border-primary overflow-hidden">
          <button type="button" className={`px-4 py-1 ${mode === 'day' ? 'bg-primary' : 'bg-card'}`} onClick={() => setMode('day')}>
            <span className={`text-lg ${mode === 'day' ? 'text-primary-foreground' : 'text-foreground'}`}>日</span>
          </button>
          <button type="button" className={`px-4 py-1 ${mode === 'week' ? 'bg-primary' : 'bg-card'}`} onClick={() => setMode('week')}>
            <span className={`text-lg ${mode === 'week' ? 'text-primary-foreground' : 'text-foreground'}`}>周</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="press-sketch rounded-sketch bg-card border-2 border-border/40 w-9 h-9 flex items-center justify-center" onClick={() => setCurDate(mode === 'week' ? addDays(ws, -7) : addDays(curDate, -1))}>
            <div className="i-lucide-chevron-left w-5 h-5 text-foreground" />
          </button>
          <span className="text-xl text-foreground font-hand min-w-24 text-center">{mode === 'week' ? `${fmt(ws).slice(5)} 那周` : fmt(curDate).slice(5)}</span>
          <button type="button" className="press-sketch rounded-sketch bg-card border-2 border-border/40 w-9 h-9 flex items-center justify-center" onClick={() => setCurDate(mode === 'week' ? addDays(ws, 7) : addDays(curDate, 1))}>
            <div className="i-lucide-chevron-right w-5 h-5 text-foreground" />
          </button>
        </div>
      </div>

      {/* 时间网格 */}
      <ScrollView scrollX className="flex-1" enhanced showScrollbar={false}>
        <div style={{ width: `${gridW}px` }} className="relative">
          {/* 小时行 */}
          {Array.from({ length: ROWS }, (_, i) => {
            const h = HOUR_START + i
            return (
              <div key={h} className="absolute left-0 right-0 border-t border-dashed border-border/30" style={{ top: `${GRID_TOP + i * ROW_H}px`, height: `${ROW_H}px` }}>
                <span className="absolute -top-2 left-1 text-base text-muted-foreground bg-background px-1">{h}:00</span>
              </div>
            )
          })}
          {/* 周表头 */}
          {mode === 'week' ? (
            weekDays.map((d, i) => (
              <div key={d} className={`absolute text-center ${d === todayStr() ? 'text-primary font-bold' : 'text-muted-foreground'}`} style={{ left: `${HOUR_LABEL_W + i * DAY_W}px`, top: '4px', width: `${DAY_W}px` }}>
                <p className="text-base leading-tight">周{weekdayCN(d)}</p>
                <p className="text-base leading-tight">{parseDate(d).getDate()}</p>
              </div>
            ))
          ) : (
            <div className="absolute text-center text-muted-foreground" style={{ left: `${HOUR_LABEL_W}px`, top: '4px', width: '300px' }}>
              <p className="text-base">{fmt(curDate)} 周{weekdayCN(curDate)}</p>
            </div>
          )}

          {/* 节点块 */}
          {(mode === 'week' ? weekDays : [curDate]).map((d, di) =>
            dayNodes(d).map((n) => (
              <div
                key={n.id}
                className={`absolute rounded-sketch-sm border-2 ${nodeColor(n)} ${dragId === n.id ? 'opacity-80 border-accent' : 'border-ink/50'} overflow-hidden`}
                style={{
                  left: `${mode === 'week' ? HOUR_LABEL_W + di * DAY_W + 3 : HOUR_LABEL_W + 8}px`,
                  width: mode === 'week' ? `${DAY_W - 6}px` : '284px',
                  top: `${topOf(n)}px`,
                  height: `${heightOf(n)}px`,
                  zIndex: dragId === n.id ? 20 : 10,
                  transform: dragId === n.id ? 'scale(1.03)' : 'scale(1)',
                  transition: 'transform 0.12s ease',
                }}
                onTouchStart={(e) => onNodeDragStart(e, n, mode === 'week' ? di : 0)}
                onTouchMove={(e) => onNodeDragMove(e, n)}
                onTouchEnd={(e) => onNodeDragEnd(e, n)}
                onClick={() => Taro.navigateTo({ url: `/pages/node-detail/index?id=${n.id}` })}
              >
                <div className="px-1 py-0.5 leading-tight">
                  <p className="text-base text-white truncate">{n.name}</p>
                  {heightOf(n) > 44 && <p className="text-sm text-white/80 truncate">{n.plan_start?.slice(0, 5)}-{n.plan_end?.slice(0, 5)}</p>}
                </div>
                {heightOf(n) > 40 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-5 flex items-center justify-center"
                    onTouchStart={(e) => onNodeDragStart(e, n, mode === 'week' ? di : 0, 'resize')}
                    onTouchMove={(e) => onNodeDragMove(e, n)}
                    onTouchEnd={(e) => onNodeDragEnd(e, n)}
                  >
                    <div className="w-6 h-1 rounded-full bg-white/70" />
                  </div>
                )}
              </div>
            ))
          )}

          {/* 网格竖线 */}
          {mode === 'week'
            ? weekDays.map((d, i) => (
                <div key={`line-${d}`} className="absolute top-8 bottom-0 border-l border-dashed border-border/30" style={{ left: `${HOUR_LABEL_W + i * DAY_W}px` }} />
              ))
            : (
              <div className="absolute top-8 bottom-0 border-l border-dashed border-border/30" style={{ left: `${HOUR_LABEL_W}px` }} />
            )}
          <div style={{ height: `${GRID_TOP + ROWS * ROW_H}px` }} />
        </div>
      </ScrollView>

      {plannedNodes.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <div className="i-lucide-calendar-plus w-12 h-12 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">还没有计划节点，先在地图上建几格</p>
        </div>
      )}
    </div>
  )
}
