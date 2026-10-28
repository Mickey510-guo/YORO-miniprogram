// @title 新建主线
import { useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { Picker } from '@tarojs/components'
import { batchInsertNodes, createMainline, createBranches } from '@/db/api'
import { generateDraft, type DraftBranch, type DraftNode } from '@/utils/planner'
import { addDays, fmt, todayStr } from '@/utils/date'

type Step = 'form' | 'review'

export default function CreateMainline() {
  const [step, setStep] = useState<Step>('form')
  // 第一步
  const [identity, setIdentity] = useState('')
  // 第二步
  const [goal, setGoal] = useState('')
  // 第三步
  const [mode, setMode] = useState<'template' | 'custom'>('template')
  const [examDate, setExamDate] = useState(addDays(todayStr(), 120))
  const [subjects, setSubjects] = useState(['', '', ''])
  const [customName, setCustomName] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  // 微调
  const [drafts, setDrafts] = useState<DraftBranch[]>([])
  const [editing, setEditing] = useState<{ bi: number; ni: number } | null>(null)
  const [editName, setEditName] = useState('')
  const [editDate, setEditDate] = useState('')

  const mainlineName = useMemo(() => {
    if (mode === 'custom') return customName.trim() || '新主线'
    return subjects.map((s) => s.trim()).filter(Boolean).join(' · ') || '新主线'
  }, [mode, customName, subjects])

  const dateLimits = useMemo(() => ({ start: addDays(todayStr(), 7), end: '2030-12-31' }), [])

  function handleGenerate() {
    const errs: Record<string, string> = {}
    if (!identity.trim()) errs.identity = '写一句你的身份与目标'
    if (!goal.trim()) errs.goal = '写一句什么算成功'
    if (mode === 'template') {
      if (subjects.every((s) => !s.trim())) errs.subjects = '至少填一个科目'
      if (!examDate) errs.examDate = '选一个考试日期'
    } else {
      if (!customName.trim()) errs.customName = '给目标起个名字'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      Taro.showToast({ title: Object.values(errs)[0], icon: 'none' })
      return
    }
    const list = mode === 'template' ? subjects.map((s) => s.trim()).filter(Boolean) : [customName.trim()]
    setDrafts(generateDraft(list, examDate))
    setStep('review')
  }

  function handleEditStart(bi: number, ni: number) {
    setEditing({ bi, ni })
    setEditName(drafts[bi].nodes[ni].name)
    setEditDate(drafts[bi].nodes[ni].plan_date)
  }

  function handleEditSave() {
    if (!editing) return
    if (!editName.trim()) {
      Taro.showToast({ title: '名字不能为空', icon: 'none' })
      return
    }
    setDrafts((prev) =>
      prev.map((b, i) =>
        i !== editing.bi ? b : { ...b, nodes: b.nodes.map((n, j) => (j !== editing.ni ? n : { ...n, name: editName.trim(), plan_date: editDate })) }
      )
    )
    setEditing(null)
  }

  function handleDelete(bi: number, ni: number) {
    setDrafts((prev) => prev.map((b, i) => (i !== bi ? b : { ...b, nodes: b.nodes.filter((_, j) => j !== ni) })))
  }

  function handleAdd(bi: number) {
    const slot = ['09:00', '10:30']
    setDrafts((prev) =>
      prev.map((b, i) =>
        i !== bi
          ? b
          : {
              ...b,
              nodes: [
                ...b.nodes,
                { name: `${b.name}·新的节点`, weight: 'main' as const, plan_date: addDays(todayStr(), 7 + b.nodes.length), plan_start: slot[0], plan_end: slot[1] },
              ],
            }
      )
    )
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const mainlineId = await createMainline({
        name: mainlineName,
        category: mode === 'template' ? '期末应试' : '自建目标',
        exam_date: examDate,
        goal_desc: goal.trim(),
        subjects: drafts.map((d) => d.name),
      })
      await createBranches(mainlineId, drafts.map((d) => ({ name: d.name, type: 'subject' as const })))
      // 建支线后按名称取回 branch id
      const { getMainlineDetail } = await import('@/db/api')
      const detail = await getMainlineDetail(mainlineId)
      const rows: { branch_id: string; name: string; weight: string; plan_date: string; plan_start: string; plan_end: string; order_index: number }[] = []
      detail?.branches.forEach((b) => {
        const draft = drafts.find((d) => d.name === b.name)
        draft?.nodes.forEach((n: DraftNode, i) => {
          rows.push({ branch_id: b.id, name: n.name, weight: n.weight, plan_date: n.plan_date, plan_start: n.plan_start, plan_end: n.plan_end, order_index: i })
        })
      })
      await batchInsertNodes(rows)
      Taro.showToast({ title: '主线已生成', icon: 'success' })
      setTimeout(() => Taro.switchTab({ url: '/pages/home/index' }), 600)
    } catch {
      Taro.showToast({ title: '生成失败，请重试', icon: 'none' })
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'review') {
    return (
      <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-2xl font-hand text-foreground">微调你的路线</p>
          <p className="text-base text-muted-foreground">改过的不会被重置；确认后落到首页地图</p>
        </div>
        <div className="flex items-center gap-2 rounded-sketch bg-muted border-2 border-border/30 px-3 py-2">
          <div className="i-lucide-flag w-5 h-5 text-primary" />
          <span className="text-lg text-foreground">{mainlineName} · 终点 {fmt(examDate).slice(5)}</span>
        </div>
        <div className="flex-1 flex flex-col gap-4 pb-4">
          {drafts.map((d, bi) => (
            <div key={bi} className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xl text-foreground font-hand">{d.name}</p>
                <button type="button" className="press-sketch rounded-sketch bg-muted border-2 border-border/40 px-3 py-1" onClick={() => handleAdd(bi)}>
                  <span className="text-base text-foreground">加节点</span>
                </button>
              </div>
              {d.nodes.map((n, ni) => (
                <div key={`${bi}-${ni}`} className="rounded-sketch bg-background border border-border/40 px-3 py-2 flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="text-lg text-foreground truncate">{n.name}</span>
                    <span className="text-base text-muted-foreground">{fmt(n.plan_date).slice(5)} {n.plan_start.slice(0, 5)}-{n.plan_end.slice(0, 5)} · {n.weight === 'main' ? '主道' : n.weight === 'side' ? '便道' : '旁路'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-none">
                    <button type="button" className="i-lucide-pencil w-5 h-5 text-muted-foreground" onClick={() => handleEditStart(bi, ni)} />
                    <button type="button" className="i-lucide-trash-2 w-5 h-5 text-muted-foreground" onClick={() => handleDelete(bi, ni)} />
                  </div>
                </div>
              ))}
              {d.nodes.length === 0 && <p className="text-base text-muted-foreground py-2 text-center">这条支线的节点删空了</p>}
            </div>
          ))}
        </div>

        {/* 编辑弹层 */}
        {editing && (
          <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center px-6" onClick={() => setEditing(null)}>
            <div className="w-full rounded-sketch bg-background border-2 border-primary shadow-sketch p-4 flex flex-col gap-3 animate-sketch-in" onClick={(e) => e.stopPropagation()}>
              <p className="text-xl text-foreground font-hand">改这个节点</p>
              <div className="rounded-sketch border-2 border-input bg-card px-3 py-2 overflow-hidden">
                <input
                  className="w-full text-xl text-foreground bg-transparent outline-none"
                  value={editName}
                  onInput={(e) => { const ev = e as any; setEditName(ev.detail?.value ?? ev.target?.value ?? '') }}
                />
              </div>
              <Picker mode="date" value={editDate} onChange={(e) => setEditDate(e.detail.value)}>
                <div className="rounded-sketch border-2 border-input bg-card px-3 py-2 flex items-center justify-between">
                  <span className="text-xl text-foreground">{editDate}</span>
                  <div className="i-lucide-calendar w-5 h-5 text-muted-foreground" />
                </div>
              </Picker>
              <div className="flex gap-2">
                <button type="button" className="flex-1 press-sketch rounded-sketch bg-primary" onClick={handleEditSave}>
                  <div className="py-2 text-lg text-primary-foreground">改好</div>
                </button>
                <button type="button" className="flex-1 press-sketch rounded-sketch bg-muted border-2 border-border/40" onClick={() => setEditing(null)}>
                  <div className="py-2 text-lg text-foreground">取消</div>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pb-6">
          <button type="button" className="flex-1 press-sketch rounded-sketch bg-muted border-2 border-border/40" onClick={() => setStep('form')}>
            <div className="py-2.5 text-lg text-foreground">回去改信息</div>
          </button>
          <button type="button" className={`flex-1 press-sketch rounded-sketch shadow-sketch ${submitting ? 'bg-primary/50' : 'bg-primary'}`} onClick={handleConfirm}>
            <div className="py-2.5 text-lg text-primary-foreground">{submitting ? '正在生成…' : '确认，落到地图'}</div>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-hand text-foreground">新建一条主线</p>
        <p className="text-base text-muted-foreground">计划有时刻，记录无时长</p>
      </div>

      {/* 第一步：身份与目标 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-lg text-primary-foreground font-hand">1</span>
          <p className="text-xl text-foreground">你是谁，在准备什么</p>
        </div>
        {errors.identity && <p className="text-base text-destructive">{errors.identity}</p>}
        <div className="rounded-sketch border-2 border-input bg-card px-4 py-3 overflow-hidden">
          <input
            className="w-full text-xl text-foreground bg-transparent outline-none"
            placeholder="例如：我是大二学生，准备 2027 蓝桥杯加考研"
            value={identity}
            onInput={(e) => { const ev = e as any; setIdentity(ev.detail?.value ?? ev.target?.value ?? '') }}
          />
        </div>
      </div>

      {/* 第二步：终点 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-lg text-primary-foreground font-hand">2</span>
          <p className="text-xl text-foreground">写下终点</p>
        </div>
        {errors.goal && <p className="text-base text-destructive">{errors.goal}</p>}
        <div className="rounded-sketch border-2 border-input bg-card px-4 py-3 overflow-hidden">
          <input
            className="w-full text-xl text-foreground bg-transparent outline-none"
            placeholder="什么算成功由你定"
            value={goal}
            onInput={(e) => { const ev = e as any; setGoal(ev.detail?.value ?? ev.target?.value ?? '') }}
          />
        </div>
      </div>

      {/* 第三步：起点 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-lg text-primary-foreground font-hand">3</span>
          <p className="text-xl text-foreground">从哪里开始</p>
        </div>
        <div className="flex flex-col gap-2">
          {([['template', '期末应试模板', '按科目快速生成一条备考路线'], ['custom', '从零自建', '只有一个目标，边走边画']] as const).map(([k, title, desc]) => {
            const selected = mode === k
            return (
              <button key={k} type="button" className={`press-sketch rounded-sketch border-2 p-4 text-left flex flex-col gap-1 ${selected ? 'bg-muted border-primary shadow-sketch-sm' : 'bg-card border-border/40'}`} onClick={() => setMode(k)}>
                <span className="text-xl text-foreground">{title}</span>
                <span className="text-base text-muted-foreground">{desc}</span>
              </button>
            )
          })}
        </div>

        {mode === 'template' ? (
          <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-3">
            {errors.examDate && <p className="text-base text-destructive">{errors.examDate}</p>}
            <p className="text-lg text-foreground">考试日期</p>
            <Picker mode="date" value={examDate} start={dateLimits.start} end={dateLimits.end} onChange={(e) => setExamDate(e.detail.value)}>
              <div className="rounded-sketch border-2 border-input bg-background px-3 py-2 flex items-center justify-between">
                <span className="text-xl text-foreground">{examDate}</span>
                <div className="i-lucide-calendar-days w-5 h-5 text-muted-foreground" />
              </div>
            </Picker>
            {errors.subjects && <p className="text-base text-destructive">{errors.subjects}</p>}
            <p className="text-lg text-foreground">三个科目（至少一个）</p>
            {subjects.map((s, i) => (
              <div key={i} className="rounded-sketch border-2 border-input bg-background px-3 py-2 overflow-hidden">
                <input
                  className="w-full text-xl text-foreground bg-transparent outline-none"
                  placeholder={['例如：高等数学', '例如：大学英语', '例如：数据结构'][i]}
                  value={s}
                  onInput={(e) => { const ev = e as any; const v = ev.detail?.value ?? ev.target?.value ?? ''; setSubjects((prev) => prev.map((x, j) => (j === i ? v : x))) }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-3">
            {errors.customName && <p className="text-base text-destructive">{errors.customName}</p>}
            <div className="rounded-sketch border-2 border-input bg-background px-3 py-2 overflow-hidden">
              <input
                className="w-full text-xl text-foreground bg-transparent outline-none"
                placeholder="目标名称，例如：考上 CPA"
                value={customName}
                onInput={(e) => { const ev = e as any; setCustomName(ev.detail?.value ?? ev.target?.value ?? '') }}
              />
            </div>
            <p className="text-base text-muted-foreground">考试日期默认用终点 {fmt(examDate).slice(5)}，可在「我的」里调整</p>
            <Picker mode="date" value={examDate} start={dateLimits.start} end={dateLimits.end} onChange={(e) => setExamDate(e.detail.value)}>
              <div className="rounded-sketch border-2 border-input bg-background px-3 py-2 flex items-center justify-between">
                <span className="text-xl text-foreground">{examDate}</span>
                <div className="i-lucide-calendar-days w-5 h-5 text-muted-foreground" />
              </div>
            </Picker>
          </div>
        )}
      </div>

      <div className="flex-1" />
      <button type="button" className="press-sketch rounded-sketch bg-primary shadow-sketch w-full mb-6" onClick={handleGenerate}>
        <div className="py-3 text-2xl text-primary-foreground font-hand">生成我的路线</div>
      </button>
    </div>
  )
}
