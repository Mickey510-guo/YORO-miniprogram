// @title 排期日历
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { getMainlines } from '@/db/api'
import ScheduleView from '@/components/ScheduleView'

export default function Schedule() {
  const [mainlines, setMainlines] = useState<{ id: string; name: string }[]>([])
  const [activeId, setActiveId] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const lines = await getMainlines()
      setMainlines(lines.map((l) => ({ id: l.id, name: l.name })))
      setActiveId((prev) => (prev && lines.some((l) => l.id === prev) ? prev : lines[0]?.id ?? ''))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useDidShow(() => { load() })

  const active = useMemo(() => mainlines.find((m) => m.id === activeId), [mainlines, activeId])

  return (
    <div className="min-h-screen paper-texture flex flex-col">
      {/* 顶部说明 + 主线切换 */}
      <div className="px-4 pt-3 pb-1 flex flex-col gap-2">
        <div className="glass rounded-sketch-lg px-4 py-2">
          <p className="text-base text-muted-foreground">这里排的是打算什么时候走；走完了回地图记一笔，不看用了多久。</p>
        </div>
        {mainlines.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {mainlines.map((m) => {
              const on = m.id === activeId
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`press-sketch rounded-full px-3 py-1 border ${on ? 'bg-primary border-primary' : 'bg-card border-border/60'}`}
                  onClick={() => setActiveId(m.id)}
                >
                  <span className={`text-base ${on ? 'text-primary-foreground' : 'text-foreground'}`}>{m.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20">
          <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-xl text-muted-foreground">正在展开排期…</p>
        </div>
      ) : active ? (
        <ScheduleView mainlineId={activeId} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 py-20 px-8">
          <div className="i-lucide-calendar-off w-14 h-14 text-muted-foreground" />
          <p className="text-xl text-muted-foreground">还没有主线，先去新建一条吧</p>
          <button type="button" className="press-sketch rounded-sketch bg-primary px-6 py-2" onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}>
            <div className="py-1 text-xl text-primary-foreground">新建主线</div>
          </button>
        </div>
      )}
    </div>
  )
}
