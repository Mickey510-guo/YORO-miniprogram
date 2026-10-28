// @title YORO
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Image, ScrollView } from '@tarojs/components'
import { getMainlines, getMainlineDetail } from '@/db/api'
import type { MainlineDetail } from '@/db/types'
import { countdown, prettyDate, todayStr } from '@/utils/date'
import MapCanvas from '@/components/MapCanvas'
import ScheduleView from '@/components/ScheduleView'

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mainlines, setMainlines] = useState<{ id: string; name: string; exam_date: string }[]>([])
  const [activeId, setActiveId] = useState('')
  const [detail, setDetail] = useState<MainlineDetail | null>(null)
  const [view, setView] = useState<'map' | 'schedule'>('map')
  const [showGuide, setShowGuide] = useState(false)
  const mapVersion = useRef(0)

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const lines = await getMainlines()
      if (lines.length === 0) {
        setMainlines([])
        setDetail(null)
        setShowGuide(true)
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

  // 汇总文案
  const summary = useMemo(() => {
    if (!detail) return ''
    const subjects = detail.branches.filter((b) => b.type === 'subject')
    const doneTotal = subjects.reduce((acc, b) => acc + b.nodes.filter((n) => n.status === 'done').length, 0)
    const dates = subjects.flatMap((b) => b.nodes.filter((n) => n.status === 'done' && n.done_date).map((n) => n.done_date as string))
    if (dates.length === 0) return doneTotal > 0 ? `今天做成了 ${doneTotal} 件事` : '从记一笔开始，走出第一格'
    const first = dates.slice().sort()[0]
    const days = Math.max(Math.round((Date.parse(todayStr()) - Date.parse(first)) / 86400000) + 1, 1)
    return `你已经走了 ${days} 天，${doneTotal} 格`
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
        <button type="button" className="press-sketch rounded-sketch bg-primary px-6 py-3 text-xl text-primary-foreground" onClick={() => loadAll()}>
          <div className="py-1">重新加载</div>
        </button>
      </div>
    )
  }

  if (mainlines.length === 0) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-6 px-8">
        <div className="i-lucide-map w-20 h-20 text-primary tilt-left" />
        <h1 className="text-3xl font-hand text-foreground">把你的备考画成一条路</h1>
        <p className="text-xl text-muted-foreground text-center leading-relaxed">计划有时刻，记录无时长。先写下你的终点，或看看示例地图长什么样。</p>
        <div className="flex flex-col gap-3 w-full">
          <button type="button" className="press-sketch rounded-sketch bg-primary shadow-sketch w-full" onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}>
            <div className="py-3 text-xl text-primary-foreground">写下我的终点</div>
          </button>
          <button type="button" className="press-sketch rounded-sketch bg-card border-2 border-primary w-full" onClick={() => Taro.navigateTo({ url: '/pages/templates/index' })}>
            <div className="py-3 text-xl text-foreground">先随便看看示例地图</div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col">
      {/* 首次进入引导（有数据也可从示例地图回来） */}
      {showGuide && (
        <div className="mx-4 mt-3 rounded-sketch bg-card border-2 border-primary shadow-sketch-sm animate-sketch-in">
          <div className="p-4 flex items-start gap-3">
            <div className="i-lucide-compass w-8 h-8 text-primary shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <p className="text-xl text-foreground">开始之前</p>
              <p className="text-base text-muted-foreground leading-relaxed">写下我的终点，或先随便看看示例地图。</p>
              <div className="flex gap-2 mt-1">
                <button type="button" className="press-sketch rounded-sketch bg-primary px-4 py-2 text-base text-primary-foreground" onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}>写下我的终点</button>
                <button type="button" className="press-sketch rounded-sketch bg-muted px-4 py-2 text-base text-foreground" onClick={() => { Taro.setStorageSync('yoro_guide_seen', '1'); setShowGuide(false); Taro.navigateTo({ url: '/pages/templates/index?demo=1' }) }}>先随便看看示例地图</button>
              </div>
            </div>
            <button type="button" className="i-lucide-x w-6 h-6 text-muted-foreground shrink-0" onClick={() => setShowGuide(false)} />
          </div>
        </div>
      )}

      {/* 主线切换器 */}
      <ScrollView scrollX className="w-full flex-none" enhanced showScrollbar={false}>
        <div className="flex gap-3 px-4 py-3 items-center">
          {mainlines.map((m) => {
            const cd = countdown(m.exam_date)
            const isActive = m.id === activeId
            return (
              <button
                type="button"
                key={m.id}
                className={`press-sketch rounded-sketch border-2 flex-none flex flex-col items-start px-4 py-2 ${isActive ? 'bg-primary border-primary shadow-sketch-sm' : 'bg-card border-border/40'}`}
                onClick={() => switchLine(m.id)}
              >
                <span className={`text-xl font-hand ${isActive ? 'text-primary-foreground' : 'text-foreground'}`}>{m.name}</span>
                <span className={`text-base mt-1 ${isActive ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{cd > 0 ? `还有 ${cd} 天` : '已到终点'}</span>
              </button>
            )
          })}
          <button type="button" className="press-sketch rounded-sketch border-2 border-dashed border-border/60 flex-none px-4 py-3 bg-transparent" onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}>
            <div className="i-lucide-plus w-6 h-6 text-muted-foreground" />
          </button>
        </div>
      </ScrollView>

      {/* 进度一句话 */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <div className="i-lucide-footprints w-5 h-5 text-primary" />
        <p className="text-xl text-foreground font-hand">{summary}</p>
      </div>

      {/* 主体视图 */}
      {view === 'map' ? (
        <div className="flex-1 relative">
          {detail ? (
            <MapCanvas
              key={`${activeId}-${mapVersion.current}`}
              detail={detail}
              onNodeClick={(nodeId) => Taro.navigateTo({ url: `/pages/node-detail/index?id=${nodeId}` })}
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 py-20">
              <div className="i-lucide-route w-14 h-14 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">这条主线还没有支线，去新建一条吧</p>
            </div>
          )}
          {/* 记一笔悬浮按钮 */}
          <button
            type="button"
            className="absolute right-4 bottom-24 press-sketch rounded-full bg-primary shadow-sketch flex items-center gap-2 px-5 py-4"
            onClick={() => Taro.navigateTo({ url: `/pages/record/index?mainline=${activeId}` })}
          >
            <div className="i-lucide-pencil-line w-6 h-6 text-primary-foreground" />
            <span className="text-xl text-primary-foreground font-hand">今天做成了什么</span>
          </button>
        </div>
      ) : (
        <ScheduleView mainlineId={activeId} onSwitchToMap={() => setView('map')} />
      )}

      {/* 底部图例 + 视图切换 */}
      <div className="flex-none border-t-2 border-dashed border-border/50 bg-background px-4 py-3">
        {view === 'map' && (
          <div className="flex flex-wrap gap-x-4 gap-y-2 mb-3">
            <div className="flex items-center gap-1"><span className="w-5 border-t-2 border-solid border-ink inline-block" /><span className="text-base text-muted-foreground">已走</span></div>
            <div className="flex items-center gap-1"><span className="w-5 border-t-2 border-dashed border-ink inline-block" /><span className="text-base text-muted-foreground">未走</span></div>
            <div className="flex items-center gap-1"><span className="w-5 border-t-2 border-dotted border-ink inline-block" /><span className="text-base text-muted-foreground">冬眠</span></div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 bg-ink rotate-45 inline-block" /><span className="text-base text-muted-foreground">补给站</span></div>
            <div className="flex items-center gap-1"><span className="w-4 h-4 rounded-full border-2 border-solid border-ink inline-block" /><span className="text-base text-muted-foreground">岔路口</span></div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-base text-muted-foreground">{prettyDate(todayStr())}</p>
          <button
            type="button"
            className="press-sketch rounded-sketch border-2 border-primary bg-card px-4 py-2 flex items-center gap-2"
            onClick={() => setView(view === 'map' ? 'schedule' : 'map')}
          >
            <div className={view === 'map' ? 'i-lucide-calendar-days w-5 h-5 text-primary' : 'i-lucide-map w-5 h-5 text-primary'} />
            <span className="text-xl text-primary">{view === 'map' ? '看排期' : '看地图'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
