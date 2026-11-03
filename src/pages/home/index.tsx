// @title YORO
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { getMainlines, getMainlineDetail } from '@/db/api'
import type { MainlineDetail } from '@/db/types'
import { countdown, prettyDate, todayStr } from '@/utils/date'
import Roadmap from '@/components/Roadmap'
import ScheduleView from '@/components/ScheduleView'
import TimerPanel from '@/components/TimerPanel'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainlines, setMainlines] = useState<{ id: string; name: string; exam_date: string }[]>([])
  const [activeId, setActiveId] = useState('')
  const [detail, setDetail] = useState<MainlineDetail | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [view, setView] = useState<'map' | 'schedule'>('map')
  const [timerOpen, setTimerOpen] = useState(false)
  const mapVersion = useRef(0)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const lines = await getMainlines()
      if (lines.length === 0) {
        setMainlines([])
        setDetail(null)
        if (!Taro.getStorageSync('yoro_guide_seen')) setShowGuide(true)
        return
      }
      if (!Taro.getStorageSync('yoro_guide_seen')) setShowGuide(true)
      setMainlines(lines.map((l) => ({ id: l.id, name: l.name, exam_date: l.exam_date })))
      const target = activeId && lines.some((l) => l.id === activeId) ? activeId : lines[0].id
      setActiveId(target)
      const d = await getMainlineDetail(target)
      setDetail(d)
    } catch {
      setError('地图加载失败，请下拉重试')
    } finally {
      setLoading(false)
    }
  }, [activeId])

  useEffect(() => { loadAll() }, [loadAll])
  useDidShow(() => { loadAll() })

  const switchLine = useCallback(async (id: string) => {
    if (id === activeId) return
    setActiveId(id)
    setLoading(true)
    try {
      const d = await getMainlineDetail(id)
      setDetail(d)
    } finally {
      setLoading(false)
    }
  }, [activeId])

  const closeGuide = useCallback(() => {
    Taro.setStorageSync('yoro_guide_seen', '1')
    setShowGuide(false)
  }, [])

  // 今日概览：今日已走格数 + 当前在走节点
  const overview = useMemo(() => {
    if (!detail) return { todayDone: 0, current: null as null | { branch: string; node: string } }
    const today = todayStr()
    let todayDone = 0
    let current: { branch: string; node: string } | null = null
    for (const b of detail.branches) {
      if (b.type !== 'subject' || b.status === 'archived') continue
      const sorted = [...b.nodes].sort((x, y) => x.order_index - y.order_index)
      todayDone += sorted.filter((n) => n.status === 'done' && n.done_date === today).length
      if (!current && b.status !== 'hibernate') {
        const frontier = sorted.find((n) => n.status === 'planned')
        if (frontier) current = { branch: b.name, node: frontier.name }
      }
    }
    return { todayDone, current }
  }, [detail])

  const active = mainlines.find((m) => m.id === activeId)

  if (loading && mainlines.length === 0) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xl text-muted-foreground">正在铺开地图…</p>
      </div>
    )
  }

  if (error && mainlines.length === 0) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-4 px-8">
        <div className="i-lucide-map-off w-16 h-16 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">{error}</p>
        <button type="button" className="press-sketch rounded-sketch bg-primary px-6 py-3" onClick={() => loadAll()}>
          <div className="py-1 text-xl text-primary-foreground">重新加载</div>
        </button>
      </div>
    )
  }

  // 轻引导浮层（可跳过）
  const guideOverlay = showGuide && (
    <div className="fixed inset-0 z-50 bg-foreground/30 flex items-center justify-center px-6">
      <div className="glass-strong rounded-sketch-lg w-full p-5 flex flex-col gap-4 animate-sketch-in">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-hand text-foreground">开始之前</p>
          <button type="button" className="press-sketch text-base text-muted-foreground" onClick={closeGuide}>跳过</button>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/12 border border-primary/30 flex items-center justify-center flex-none">
            <div className="i-lucide-map-pin w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xl text-foreground">写下终点去哪里</p>
            <p className="text-base text-muted-foreground mt-0.5">先定一个想抵达的考试日，路线就有了方向。</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center flex-none">
            <div className="i-lucide-route w-5 h-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xl text-foreground">看地图怎么走</p>
            <p className="text-base text-muted-foreground mt-0.5">走过的点亮成格，歇几天也没关系，不催你。</p>
          </div>
        </div>
        <button type="button" className="press-sketch rounded-sketch bg-primary mt-1" onClick={closeGuide}>
          <div className="py-3 text-xl text-primary-foreground">知道了</div>
        </button>
      </div>
    </div>
  )

  // 空态：还没建主线
  if (mainlines.length === 0) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-6 px-8 relative">
        <div className="i-lucide-compass w-20 h-20 text-primary" />
        <h1 className="text-3xl font-hand text-foreground text-center">把你的备考画成一条路</h1>
        <p className="text-xl text-muted-foreground text-center leading-relaxed">计划有时刻，记录无时长。先写下你的终点，或看看示例地图长什么样。</p>
        <div className="flex flex-col gap-3 w-full">
          <button type="button" className="press-sketch rounded-sketch bg-primary shadow-sketch w-full" onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}>
            <div className="py-3 text-xl text-primary-foreground">写下我的终点</div>
          </button>
          <button type="button" className="press-sketch rounded-sketch bg-card border border-primary/50 w-full" onClick={() => Taro.navigateTo({ url: '/pages/templates/index?demo=1' })}>
            <div className="py-3 text-xl text-primary">先随便看看示例地图</div>
          </button>
        </div>
        {guideOverlay}
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col relative">
      {guideOverlay}

      <div className="px-4 pt-3 pb-28 flex flex-col gap-4">
        {/* 倒计时卡片 */}
        <div className="glass rounded-sketch-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <p className="text-base text-muted-foreground">距离终点</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-hand text-primary leading-none">{active ? countdown(active.exam_date) : '—'}</span>
                <span className="text-xl text-muted-foreground mb-1">天</span>
              </div>
              <p className="text-base text-muted-foreground mt-1">{active?.name} · {active?.exam_date}</p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center flex-none">
              <div className="i-lucide-flag w-7 h-7 text-primary" />
            </div>
          </div>
          {mainlines.length > 1 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {mainlines.map((m) => {
                const on = m.id === activeId
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`press-sketch rounded-full px-3 py-1 border ${on ? 'bg-primary border-primary' : 'bg-card border-border/60'}`}
                    onClick={() => switchLine(m.id)}
                  >
                    <span className={`text-base ${on ? 'text-primary-foreground' : 'text-foreground'}`}>{m.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 今日概览卡片 */}
        <div className="glass rounded-sketch-lg p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="i-lucide-footprints w-6 h-6 text-primary flex-none" />
            <span className="text-xl text-foreground">今日已走 {overview.todayDone} 格</span>
          </div>
          {overview.current ? (
            <p className="text-base text-muted-foreground leading-snug">当前在走：{overview.current.branch} · {overview.current.node}</p>
          ) : (
            <p className="text-base text-muted-foreground">今天还没有进行中的节点，从记一笔开始吧</p>
          )}
          <button type="button" className="press-sketch rounded-sketch bg-primary mt-1" onClick={() => Taro.navigateTo({ url: `/pages/record/index?mainline=${activeId}` })}>
            <div className="py-3 text-xl text-primary-foreground flex items-center justify-center gap-2">
              <div className="i-lucide-pencil-line w-5 h-5" />
              <span>今天做成了什么</span>
            </div>
          </button>
        </div>

        {/* 视图切换 + 静默计时入口 */}
        <div className="flex items-center justify-between gap-3">
          <div className="glass rounded-full p-1 flex items-center gap-1">
            <button type="button" className={`press-sketch rounded-full px-4 py-1 ${view === 'map' ? 'bg-primary' : ''}`} onClick={() => setView('map')}>
              <span className={`text-base ${view === 'map' ? 'text-primary-foreground' : 'text-foreground'}`}>路线图</span>
            </button>
            <button type="button" className={`press-sketch rounded-full px-4 py-1 ${view === 'schedule' ? 'bg-primary' : ''}`} onClick={() => setView('schedule')}>
              <span className={`text-base ${view === 'schedule' ? 'text-primary-foreground' : 'text-foreground'}`}>排期</span>
            </button>
          </div>
          <button type="button" className="press-sketch glass rounded-full px-4 py-1 flex items-center gap-1" onClick={() => setTimerOpen(true)}>
            <div className="i-lucide-hourglass w-4 h-4 text-primary" />
            <span className="text-base text-foreground">静默计时</span>
          </button>
        </div>

        {/* 路线图 / 排期视图 */}
        {view === 'schedule' && detail ? (
          <ScheduleView mainlineId={activeId} onSwitchToMap={() => setView('map')} />
        ) : view === 'map' && detail ? (
          <Roadmap
            key={`${activeId}-${mapVersion.current}`}
            detail={detail}
            onNodeClick={(nodeId) => Taro.navigateTo({ url: `/pages/node-detail/index?id=${nodeId}` })}
          />
        ) : (
          <div className="glass rounded-sketch-lg flex flex-col items-center justify-center gap-3 py-16">
            <div className="i-lucide-route w-14 h-14 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">这条主线还没有支线，去新建一条吧</p>
          </div>
        )}
      </div>

      {/* 右下悬浮：新建主线 */}
      <button
        type="button"
        className="fixed right-5 bottom-24 w-14 h-14 rounded-full bg-primary shadow-sketch flex items-center justify-center press-sketch z-40"
        onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}
      >
        <div className="i-lucide-plus w-7 h-7 text-primary-foreground" />
      </button>

      {/* 底部日期 */}
      <p className="fixed left-0 right-0 bottom-24 text-center text-sm text-muted-foreground pointer-events-none">{prettyDate(todayStr())}</p>

      <TimerPanel open={timerOpen} onClose={() => setTimerOpen(false)} />
    </div>
  )
}
