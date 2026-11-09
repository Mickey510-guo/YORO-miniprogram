// @title 看板
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { getAllBranches, getAllDoneNodes, getFootprints } from '@/db/api'
import type { Branch, NodeItem } from '@/db/types'
import { monthStart, todayStr, weekStart } from '@/utils/date'

type Range = 'week' | 'month'

export default function Stats() {
  const [range, setRange] = useState<Range>('week')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [branches, setBranches] = useState<Branch[]>([])
  const [doneNodes, setDoneNodes] = useState<NodeItem[]>([])
  const [footMap, setFootMap] = useState<Record<string, string[]>>({})
  const [drillBranch, setDrillBranch] = useState<Branch | null>(null)
  const [drillNodes, setDrillNodes] = useState<NodeItem[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [bs, nodes] = await Promise.all([getAllBranches(), getAllDoneNodes()])
      setBranches(bs)
      setDoneNodes(nodes)
      const habitIds = bs.filter((b) => b.type === 'habit').map((b) => b.id)
      const fps = await getFootprints(habitIds)
      const map: Record<string, string[]> = {}
      fps.forEach((f) => {
        map[f.branch_id] = [...(map[f.branch_id] ?? []), f.footprint_date]
      })
      setFootMap(map)
    } catch {
      setError('看板加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rangeStart = useMemo(() => (range === 'week' ? weekStart(todayStr()) : monthStart(todayStr())), [range])

  // 里程区：任务支线统计
  const mileage = useMemo(() => {
    const subjects = branches.filter((b) => b.type === 'subject')
    const rows = subjects.map((b) => {
      const inRange = doneNodes.filter((n) => n.branch_id === b.id && (n.done_date ?? '') >= rangeStart)
      return { branch: b, count: inRange.length, nodes: inRange }
    })
    const total = rows.reduce((acc, r) => acc + r.count, 0)
    return { rows, total }
  }, [branches, doneNodes, rangeStart])

  // 脚印区：习惯支线统计（累计 + 本周）
  const footprints = useMemo(() => {
    const habits = branches.filter((b) => b.type === 'habit')
    const rows = habits.map((b) => {
      const all = footMap[b.id] ?? []
      const inRange = all.filter((d) => d >= rangeStart)
      return { branch: b, total: all.length, inRange: inRange.length }
    })
    return rows
  }, [branches, footMap, rangeStart])

  const maxCount = useMemo(() => Math.max(...mileage.rows.map((r) => r.count), 1), [mileage])

  async function handleDrill(b: Branch) {
    try {
      const { getNodesOfBranch } = await import('@/db/api')
      setDrillBranch(b)
      setDrillNodes(await getNodesOfBranch(b.id))
    } catch {
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xl text-muted-foreground">正在翻看板…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3 px-8">
        <div className="i-lucide-bar-chart-off w-14 h-14 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">{error}</p>
        <button type="button" className="press-sketch rounded-sketch bg-primary px-6 py-2" onClick={() => load()}>
          <div className="py-1 text-xl text-primary-foreground">重试</div>
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-5">
      {/* 周月切换 */}
      <div className="flex items-center justify-between">
        <p className="text-2xl font-hand text-foreground">看板</p>
        <div className="flex rounded-sketch border-2 border-primary overflow-hidden">
          <button type="button" className={`px-4 py-1 ${range === 'week' ? 'bg-primary' : 'bg-card'}`} onClick={() => setRange('week')}>
            <span className={`text-lg ${range === 'week' ? 'text-primary-foreground' : 'text-foreground'}`}>本周</span>
          </button>
          <button type="button" className={`px-4 py-1 ${range === 'month' ? 'bg-primary' : 'bg-card'}`} onClick={() => setRange('month')}>
            <span className={`text-lg ${range === 'month' ? 'text-primary-foreground' : 'text-foreground'}`}>本月</span>
          </button>
        </div>
      </div>

      {/* 里程区 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <div className="i-lucide-route w-6 h-6 text-primary" />
          <p className="text-xl text-foreground font-hand">里程 · 任务支线</p>
        </div>
        <div className="flex items-end gap-3">
          <span className="text-5xl font-hand text-primary leading-none">{mileage.total}</span>
          <span className="text-lg text-muted-foreground mb-1">{range === 'week' ? '本周走过的段数' : '本月走过的段数'}</span>
        </div>
        {mileage.rows.length === 0 && <p className="text-xl text-muted-foreground">还没有科目支线</p>}
        {/* 支线分布可视化 */}
        <div className="flex flex-col gap-3">
          {mileage.rows.map((r) => (
            <div key={r.branch.id} className="flex flex-col gap-1" onClick={() => handleDrill(r.branch)}>
              <div className="flex items-center justify-between">
                <span className="text-lg text-foreground">{r.branch.name}{r.branch.status === 'hibernate' && ' · 冬眠中'}</span>
                <span className="text-lg text-muted-foreground">{r.count} 段</span>
              </div>
              <div className="h-4 rounded-sketch-sm bg-muted border border-border/40 overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${Math.round((r.count / maxCount) * 100)}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-base text-muted-foreground">点支线可以看它走过的节点</p>
      </div>

      {/* 脚印区 */}
      <div className="rounded-sketch bg-muted border-2 border-dashed border-border/50 p-4 flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="i-lucide-footprints w-6 h-6 text-primary" />
          <p className="text-xl text-foreground font-hand">脚印 · 习惯支线</p>
        </div>
        <p className="text-base text-muted-foreground">里程与脚印各自记录，互不换算</p>
        {footprints.length === 0 && <p className="text-xl text-muted-foreground">还没有习惯支线</p>}
        {footprints.map((r) => (
          <div key={r.branch.id} className="rounded-sketch bg-card border-2 border-border/30 p-3 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-lg text-foreground">{r.branch.name}</span>
              <span className="text-base text-muted-foreground">累计 {r.total} 个脚印</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-2xl font-hand text-primary">{r.inRange}</span>
              <span className="text-base text-muted-foreground">{range === 'week' ? '本周脚印' : '本月脚印'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 下钻弹层 */}
      {drillBranch && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-end" onClick={() => setDrillBranch(null)}>
          <div className="w-full rounded-t-3xl bg-background p-4 flex flex-col gap-3 animate-sketch-in max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-hand text-foreground">{drillBranch.name} · 走过的节点</p>
              <button type="button" className="i-lucide-x w-6 h-6 text-muted-foreground" onClick={() => setDrillBranch(null)} />
            </div>
            {drillNodes.filter((n) => n.status === 'done').length === 0 && <p className="text-xl text-muted-foreground py-6 text-center">这条支线还没走过节点</p>}
            {drillNodes.filter((n) => n.status === 'done').map((n) => (
              <div key={n.id} className="rounded-sketch bg-card border-2 border-border/30 p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg text-foreground">{n.done_content || n.name}</span>
                  <span className="text-base text-muted-foreground">{n.done_date}</span>
                </div>
                <span className="text-base text-muted-foreground">{n.weight === 'main' ? '主道' : n.weight === 'side' ? '便道' : '旁路'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
