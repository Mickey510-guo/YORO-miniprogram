// @title 起点模板库
import { useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { batchInsertNodes, createBranches, createMainline, getMainlineDetail, getMainlines } from '@/db/api'
import type { MainlineDetail } from '@/db/types'
import { generateDraft } from '@/utils/planner'
import { addDays, todayStr } from '@/utils/date'
import Roadmap from '@/components/Roadmap'

interface Template {
  name: string
  exam: string
  days: number
  subjects: string[]
}

const TEMPLATES: Template[] = [
  { name: '期末应试 · 三科目', exam: '期末应试', days: 45, subjects: ['高等数学', '大学英语', '专业课'] },
  { name: '考研全科 · 上岸路线', exam: '考研', days: 300, subjects: ['数学', '英语', '专业课'] },
  { name: '考公基础 · 行测申论', exam: '考公与事业单位', days: 180, subjects: ['行测', '申论', '常识'] },
  { name: '蓝桥杯 · 省一冲刺', exam: '学科竞赛', days: 120, subjects: ['算法', '数据结构'] },
  { name: 'CPA · 会计与税法', exam: '职业资格考证', days: 240, subjects: ['会计', '税法', '经济法'] },
]

export default function Templates() {
  const [importing, setImporting] = useState<string | null>(null)
  const [demoDetail, setDemoDetail] = useState<MainlineDetail | null>(null)
  const [demoLoading, setDemoLoading] = useState(true)
  const isDemo = useMemo(() => {
    const params = Taro.getCurrentInstance().router?.params || {}
    return params.demo === '1'
  }, [])

  useEffect(() => {
    if (!isDemo) return
    let alive = true
    getMainlines()
      .then((lines) => {
        const first = lines[0]
        if (!first) {
          if (alive) setDemoLoading(false)
          return
        }
        return getMainlineDetail(first.id).then((d) => {
          if (alive) {
            setDemoDetail(d)
            setDemoLoading(false)
          }
        })
      })
      .catch(() => {
        if (alive) setDemoLoading(false)
      })
    return () => {
      alive = false
    }
  }, [isDemo])

  function backToMine() {
    Taro.navigateBack().catch(() => Taro.switchTab({ url: '/pages/home/index' }))
  }

  async function handleImport(t: Template) {
    if (importing) return
    setImporting(t.name)
    try {
      const examDate = addDays(todayStr(), t.days)
      const mainlineId = await createMainline({
        name: t.exam,
        category: t.exam,
        exam_date: examDate,
        goal_desc: `用「${t.name}」模板开始`,
        subjects: t.subjects,
      })
      await createBranches(mainlineId, t.subjects.map((s) => ({ name: s, type: 'subject' as const })))
      const { getMainlineDetail } = await import('@/db/api')
      const detail = await getMainlineDetail(mainlineId)
      const drafts = generateDraft(t.subjects, examDate)
      const rows: { branch_id: string; name: string; weight: string; plan_date: string; plan_start: string; plan_end: string; order_index: number }[] = []
      detail?.branches.forEach((b) => {
        const draft = drafts.find((d) => d.name === b.name)
        draft?.nodes.forEach((n, i) => {
          rows.push({ branch_id: b.id, name: n.name, weight: n.weight, plan_date: n.plan_date, plan_start: n.plan_start, plan_end: n.plan_end, order_index: i })
        })
      })
      await batchInsertNodes(rows)
      Taro.showToast({ title: '模板已导入', icon: 'success' })
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 600)
    } catch {
      Taro.showToast({ title: '导入失败，请重试', icon: 'none' })
    } finally {
      setImporting(null)
    }
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-hand text-foreground">{isDemo ? '示例地图' : '起点模板库'}</p>
        <p className="text-base text-muted-foreground">{isDemo ? '一条完整的备考路线长这样，导入即可开始' : '按考试类型选一个起点，一键导入成你的主线'}</p>
      </div>

      {isDemo && (
        <>
          <div className="glass rounded-sketch-lg px-4 py-3 flex items-center gap-2">
            <button type="button" className="press-sketch flex items-center gap-1" onClick={backToMine}>
              <div className="i-lucide-arrow-left w-5 h-5 text-primary" />
              <span className="text-lg text-primary">回到我的终点</span>
            </button>
          </div>
          {demoLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-xl text-muted-foreground">正在铺开示例路线…</p>
            </div>
          ) : demoDetail ? (
            <Roadmap detail={demoDetail} readOnly />
          ) : (
            <div className="glass rounded-sketch-lg flex flex-col items-center justify-center gap-3 py-16">
              <div className="i-lucide-route w-14 h-14 text-muted-foreground" />
              <p className="text-xl text-muted-foreground">暂时没有示例数据</p>
            </div>
          )}
        </>
      )}

      {!isDemo && (
      <div className="flex flex-col gap-3 pb-6">
        {TEMPLATES.map((t) => (
          <div key={t.name} className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xl text-foreground font-hand">{t.name}</span>
              <span className="text-base text-muted-foreground">{t.days} 天周期</span>
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              {t.subjects.map((s) => (
                <span key={s} className="rounded-sketch bg-muted border border-border/40 px-2 py-0.5 text-base text-muted-foreground">{s}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base text-muted-foreground">适用：{t.exam}</span>
              <button
                type="button"
                className={`press-sketch rounded-sketch px-4 py-1.5 ${importing === t.name ? 'bg-primary/50' : 'bg-primary'}`}
                onClick={() => handleImport(t)}
              >
                <span className="text-lg text-primary-foreground">{importing === t.name ? '导入中…' : '一键导入'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  )
}
