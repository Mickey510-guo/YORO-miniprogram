// @title 习惯支线
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { addFootprint, createBranches, archiveBranch, getFootprints, getHabitBranches, updateBranchRule } from '@/db/api'
import type { Branch } from '@/db/types'
import { todayStr } from '@/utils/date'

export default function Habits() {
  const [habits, setHabits] = useState<Branch[]>([])
  const [footMap, setFootMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newRule, setNewRule] = useState<'daily' | 'weekly'>('daily')
  const [editId, setEditId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const hs = await getHabitBranches()
      setHabits(hs)
      const fps = await getFootprints(hs.map((h) => h.id))
      const map: Record<string, string[]> = {}
      fps.forEach((f) => {
        map[f.branch_id] = [...(map[f.branch_id] ?? []), f.footprint_date]
      })
      setFootMap(map)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useDidShow(() => { load() })

  const today = todayStr()

  async function handleCheckin(h: Branch) {
    try {
      await addFootprint(h.id)
      await load()
      Taro.showToast({ title: '多了一个脚印', icon: 'success' })
    } catch {
      Taro.showToast({ title: '打卡失败，请重试', icon: 'none' })
    }
  }

  async function handleRule(h: Branch, rule: 'daily' | 'weekly') {
    try {
      await updateBranchRule(h.id, rule)
      await load()
      Taro.showToast({ title: '规则已更新', icon: 'success' })
      setEditId(null)
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  async function handleArchive(h: Branch) {
    try {
      await archiveBranch(h.id)
      await load()
      Taro.showToast({ title: '已归档', icon: 'success' })
      setEditId(null)
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  async function handleCreate() {
    if (!newName.trim()) {
      Taro.showToast({ title: '给习惯起个名字', icon: 'none' })
      return
    }
    try {
      // 习惯支线挂在当前第一条主线下（演示数据结构）
      const { getMainlines } = await import('@/db/api')
      const lines = await getMainlines()
      if (lines.length === 0) {
        Taro.showToast({ title: '先创建一条主线', icon: 'none' })
        return
      }
      await createBranches(lines[0].id, [{ name: newName.trim(), type: 'habit', repeat_rule: newRule }])
      setNewName('')
      setCreating(false)
      await load()
      Taro.showToast({ title: '习惯支线已建好', icon: 'success' })
    } catch {
      Taro.showToast({ title: '创建失败', icon: 'none' })
    }
  }

  // 本周脚印统计
  const weekStats = useMemo(() => {
    const stats: Record<string, number> = {}
    const now = new Date()
    const ws = new Date(now)
    ws.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const wsStr = `${ws.getFullYear()}-${String(ws.getMonth() + 1).padStart(2, '0')}-${String(ws.getDate()).padStart(2, '0')}`
    habits.forEach((h) => {
      stats[h.name] = (footMap[h.id] ?? []).filter((d) => d >= wsStr).length
    })
    return stats
  }, [habits, footMap])

  // 当月日历
  const calendar = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const lead = (firstDay.getDay() + 6) % 7
    const cells: (string | null)[] = Array.from({ length: lead }, () => null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
    }
    return cells
  }, [])

  function hasFoot(date: string): boolean {
    return habits.some((h) => (footMap[h.id] ?? []).includes(date))
  }

  if (loading) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xl text-muted-foreground">正在数脚印…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-5">
      {/* 习惯列表 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-2xl font-hand text-foreground">习惯支线</p>
          <button type="button" className="press-sketch rounded-sketch bg-primary px-3 py-1.5 flex items-center gap-1" onClick={() => setCreating(true)}>
            <div className="i-lucide-plus w-5 h-5 text-primary-foreground" />
            <span className="text-lg text-primary-foreground">新建</span>
          </button>
        </div>

        {creating && (
          <div className="rounded-sketch bg-card border-2 border-primary shadow-sketch-sm p-4 flex flex-col gap-3 animate-sketch-in">
            <div className="rounded-sketch border-2 border-input bg-background px-3 py-2 overflow-hidden">
              <input
                className="w-full text-xl text-foreground bg-transparent outline-none"
                placeholder="例如：每日背单词"
                value={newName}
                onInput={(e) => { const ev = e as any; setNewName(ev.detail?.value ?? ev.target?.value ?? '') }}
              />
            </div>
            <div className="flex gap-2">
              {([['daily', '每日'], ['weekly', '每周']] as const).map(([k, label]) => (
                <button key={k} type="button" className={`flex-1 press-sketch rounded-sketch border-2 py-1.5 ${newRule === k ? 'bg-primary border-primary' : 'bg-background border-border/40'}`} onClick={() => setNewRule(k)}>
                  <span className={`text-lg ${newRule === k ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" className="flex-1 press-sketch rounded-sketch bg-primary" onClick={handleCreate}>
                <div className="py-2 text-lg text-primary-foreground">建好</div>
              </button>
              <button type="button" className="flex-1 press-sketch rounded-sketch bg-muted border-2 border-border/40" onClick={() => setCreating(false)}>
                <div className="py-2 text-lg text-foreground">取消</div>
              </button>
            </div>
          </div>
        )}

        {habits.length === 0 && !creating && (
          <div className="rounded-sketch bg-card border-2 border-dashed border-border/50 p-6 flex flex-col items-center gap-2">
            <div className="i-lucide-footprints w-12 h-12 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">还没有习惯支线，建一条慢慢走</p>
          </div>
        )}

        {habits.map((h) => {
          const feet = footMap[h.id] ?? []
          const doneToday = feet.includes(today)
          return (
            <div key={h.id} className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="i-lucide-footprints w-6 h-6 text-primary" />
                  <span className="text-xl text-foreground">{h.name}</span>
                  <span className="text-base text-muted-foreground">{h.repeat_rule === 'daily' ? '每日' : '每周'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base text-muted-foreground">{feet.length} 个脚印</span>
                  <button
                    type="button"
                    className={`press-sketch rounded-sketch border-2 px-4 py-1.5 ${doneToday ? 'bg-muted border-border/40' : 'bg-primary border-primary shadow-sketch-sm'}`}
                    onClick={() => handleCheckin(h)}
                  >
                    <span className={`text-lg ${doneToday ? 'text-muted-foreground' : 'text-primary-foreground'}`}>{doneToday ? '今天走过' : '打卡'}</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base text-muted-foreground">本周 {weekStats[h.name] ?? 0} 个脚印</span>
                <button type="button" className="i-lucide-settings-2 w-5 h-5 text-muted-foreground" onClick={() => setEditId(editId === h.id ? null : h.id)} />
              </div>
              {editId === h.id && (
                <div className="rounded-sketch bg-muted p-3 flex flex-col gap-2 animate-sketch-in">
                  <p className="text-base text-muted-foreground">重复规则</p>
                  <div className="flex gap-2">
                    {([['daily', '每日'], ['weekly', '每周']] as const).map(([k, label]) => (
                      <button key={k} type="button" className={`flex-1 press-sketch rounded-sketch border-2 py-1.5 ${h.repeat_rule === k ? 'bg-primary border-primary' : 'bg-card border-border/40'}`} onClick={() => handleRule(h, k)}>
                        <span className={`text-lg ${h.repeat_rule === k ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</span>
                      </button>
                    ))}
                  </div>
                  <button type="button" className="press-sketch rounded-sketch bg-card border-2 border-border/40" onClick={() => handleArchive(h)}>
                    <div className="py-1.5 text-lg text-muted-foreground">归档这条习惯</div>
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 日历视图：只标有脚印的日子 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-3">
        <p className="text-xl text-foreground font-hand">这个月的脚印</p>
        <div className="grid grid-cols-7 gap-2">
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
            <span key={w} className="text-base text-muted-foreground text-center">{w}</span>
          ))}
          {calendar.map((d, i) => {
            if (!d) return <span key={`empty-${i}`} />
            const day = Number(d.slice(8))
            const has = hasFoot(d)
            const isToday = d === today
            return (
              <div key={d} className={`w-full aspect-square rounded-sketch-sm flex items-center justify-center ${has ? 'bg-primary' : 'bg-transparent'} ${isToday ? 'border-2 border-accent' : ''}`}>
                <span className={`text-base ${has ? 'text-primary-foreground' : 'text-muted-foreground'}`}>{day}</span>
              </div>
            )
          })}
        </div>
        <p className="text-base text-muted-foreground">空着的日子就是没走的日子，不用补，也不提醒。</p>
      </div>

      {/* 本周脚印统计 */}
      <div className="rounded-sketch bg-muted border-2 border-dashed border-border/50 p-4 flex flex-col gap-2 mb-6">
        <p className="text-xl text-foreground font-hand">本周脚印</p>
        {habits.length === 0 && <p className="text-base text-muted-foreground">还没有习惯</p>}
        {habits.map((h) => (
          <div key={h.id} className="flex items-center justify-between">
            <span className="text-lg text-foreground">{h.name}</span>
            <span className="text-lg text-primary">{weekStats[h.name] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
