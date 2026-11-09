// @title 节点详情
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { getNodeWithBranch, getSubsteps, addSubstep, toggleSubstep, updateNode, setBranchStatus, deleteSubstep } from '@/db/api'
import type { Branch, NodeItem, Substep } from '@/db/types'
import { MOODS, WEIGHTS } from '@/db/types'
import { prettyDate } from '@/utils/date'

export default function NodeDetail() {
  const [nodeId, setNodeId] = useState('')
  const [node, setNode] = useState<NodeItem | null>(null)
  const [branch, setBranch] = useState<Branch | null>(null)
  const [substeps, setSubsteps] = useState<Substep[]>([])
  const [newStep, setNewStep] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mood, setMood] = useState('')
  const [moodNote, setMoodNote] = useState('')

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {}
    setNodeId(params.id || '')
  }, [])

  const load = useCallback(async () => {
    if (!nodeId) return
    setLoading(true)
    try {
      const res = await getNodeWithBranch(nodeId)
      if (res) {
        setNode(res.node)
        setBranch(res.branch)
        setMood(res.node.mood || '')
        setMoodNote(res.node.mood_note || '')
        setSubsteps(await getSubsteps(nodeId))
      }
    } finally {
      setLoading(false)
    }
  }, [nodeId])

  useEffect(() => { load() }, [load])

  const hibernate = useMemo(() => branch?.status === 'hibernate', [branch])

  async function handleAddStep() {
    if (!newStep.trim() || !nodeId) return
    try {
      await addSubstep(nodeId, newStep.trim())
      setNewStep('')
      setSubsteps(await getSubsteps(nodeId))
    } catch {
      Taro.showToast({ title: '添加失败', icon: 'none' })
    }
  }

  async function handleToggle(step: Substep) {
    try {
      await toggleSubstep(step.id, !step.checked)
      setSubsteps(await getSubsteps(nodeId))
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  async function handleDeleteStep(step: Substep) {
    try {
      await deleteSubstep(step.id)
      setSubsteps(await getSubsteps(nodeId))
    } catch {
      Taro.showToast({ title: '删除失败', icon: 'none' })
    }
  }

  async function handleWeight(w: 'main' | 'side' | 'bypass') {
    if (!node) return
    try {
      await updateNode(node.id, { weight: w })
      setNode({ ...node, weight: w })
    } catch {
      Taro.showToast({ title: '修改失败', icon: 'none' })
    }
  }

  async function handleSaveMood() {
    if (!node || !mood) {
      Taro.showToast({ title: '先选一个情绪', icon: 'none' })
      return
    }
    setSaving(true)
    try {
      await updateNode(node.id, { mood, mood_note: moodNote.trim() || null })
      Taro.showToast({ title: '已留下情绪痕迹', icon: 'success' })
    } catch {
      Taro.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  async function handleSupply() {
    if (!node) return
    const kind = node.kind === 'supply' ? 'normal' : 'supply'
    try {
      await updateNode(node.id, { kind })
      setNode({ ...node, kind })
      Taro.showToast({ title: kind === 'supply' ? '已生成补给站' : '已移除补给站', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  async function handleHibernate() {
    if (!branch || !node) return
    const target = hibernate ? 'active' : 'hibernate'
    try {
      await setBranchStatus(branch.id, target)
      setBranch({ ...branch, status: target })
      Taro.showToast({ title: target === 'hibernate' ? '这条支线已冬眠' : '这条支线已唤醒', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xl text-muted-foreground">正在打开节点…</p>
      </div>
    )
  }

  if (!node || !branch) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3 px-8">
        <div className="i-lucide-circle-slash w-14 h-14 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">找不到这个节点</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-5">
      {/* 头部 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-sketch bg-muted border border-border/40 px-2 py-0.5 text-base text-muted-foreground">{branch.name}</span>
          {node.is_crossing && <span className="rounded-sketch bg-primary px-2 py-0.5 text-base text-primary-foreground">岔路口</span>}
          {node.kind === 'supply' && <span className="rounded-sketch bg-accent/80 px-2 py-0.5 text-base text-accent-foreground">补给站</span>}
          {hibernate && <span className="rounded-sketch bg-muted px-2 py-0.5 text-base text-muted-foreground">冬眠中</span>}
        </div>
        <h1 className="text-2xl font-hand text-foreground">{node.name}</h1>
        {node.done_content && <p className="text-xl text-foreground leading-relaxed">「{node.done_content}」</p>}
        <div className="flex flex-col gap-1 mt-1">
          {node.done_date && (
            <div className="flex items-center gap-1">
              <div className="i-lucide-check w-4 h-4 text-primary" />
              <span className="text-base text-muted-foreground">完成于 {prettyDate(node.done_date)}</span>
            </div>
          )}
          {node.plan_date && node.plan_start && node.plan_end && (
            <div className="flex items-center gap-1">
              <div className="i-lucide-clock w-4 h-4 text-muted-foreground" />
              <span className="text-base text-muted-foreground">计划 {prettyDate(node.plan_date)} {node.plan_start.slice(0, 5)}-{node.plan_end.slice(0, 5)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 子步骤 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-3">
        <p className="text-xl text-foreground font-hand">子步骤</p>
        {substeps.length === 0 && <p className="text-base text-muted-foreground">还没有子步骤，加一个拆小它</p>}
        {substeps.map((s) => (
          <div key={s.id} className="flex items-center gap-2">
            <button type="button" className={`w-7 h-7 rounded-sketch-sm border-2 flex items-center justify-center flex-none ${s.checked ? 'bg-primary border-primary' : 'bg-card border-input'}`} onClick={() => handleToggle(s)}>
              {s.checked && <div className="i-lucide-check w-5 h-5 text-primary-foreground" />}
            </button>
            <span className={`flex-1 text-xl ${s.checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{s.content}</span>
            <button type="button" className="i-lucide-trash-2 w-5 h-5 text-muted-foreground flex-none" onClick={() => handleDeleteStep(s)} />
          </div>
        ))}
        <div className="flex gap-2">
          <div className="flex-1 rounded-sketch border-2 border-input bg-card px-3 py-2 overflow-hidden">
            <input
              className="w-full text-xl text-foreground bg-transparent outline-none"
              placeholder="新增子步骤"
              value={newStep}
              onInput={(e) => { const ev = e as any; setNewStep(ev.detail?.value ?? ev.target?.value ?? '') }}
            />
          </div>
          <button type="button" className="press-sketch rounded-sketch bg-primary px-4" onClick={handleAddStep}>
            <div className="text-xl text-primary-foreground">加</div>
          </button>
        </div>
      </div>

      {/* 分量 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-2">
        <p className="text-xl text-foreground font-hand">分量</p>
        <div className="flex gap-2">
          {WEIGHTS.map((w) => {
            const selected = w.key === node.weight
            return (
              <button key={w.key} type="button" className={`flex-1 press-sketch rounded-sketch border-2 py-2 ${selected ? 'bg-primary border-primary' : 'bg-card border-border/40'}`} onClick={() => handleWeight(w.key)}>
                <span className={`text-xl ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{w.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 情绪与状态 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-3">
        <p className="text-xl text-foreground font-hand">此刻状态</p>
        {node.mood && !saving && (
          <div className="rounded-sketch bg-muted p-2 flex items-center gap-2">
            <div className={`${MOODS.find((m) => m.key === node.mood)?.icon ?? 'i-lucide-feather'} w-5 h-5 text-primary`} />
            <span className="text-base text-muted-foreground">已留下：{MOODS.find((m) => m.key === node.mood)?.label}{node.mood_note ? ` · ${node.mood_note}` : ''}</span>
          </div>
        )}
        <div className="flex gap-2">
          {MOODS.map((m) => {
            const selected = m.key === mood
            return (
              <button key={m.key} type="button" className={`flex-1 press-sketch rounded-sketch border-2 py-2 flex flex-col items-center gap-1 ${selected ? 'bg-primary border-primary' : 'bg-card border-border/40'}`} onClick={() => setMood(m.key)}>
                <div className={`${m.icon} w-6 h-6 ${selected ? 'text-primary-foreground' : 'text-foreground'}`} />
                <span className={`text-lg ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{m.label}</span>
              </button>
            )
          })}
        </div>
        <div className="rounded-sketch border-2 border-input bg-card px-4 py-3 overflow-hidden">
          <input
            className="w-full text-xl text-foreground bg-transparent outline-none"
            placeholder="一句话写写此刻的状态"
            value={moodNote}
            onInput={(e) => { const ev = e as any; setMoodNote(ev.detail?.value ?? ev.target?.value ?? '') }}
          />
        </div>
        <button type="button" className={`press-sketch rounded-sketch ${saving ? 'bg-primary/50' : 'bg-primary'}`} onClick={handleSaveMood}>
          <div className="py-2 text-xl text-primary-foreground">保存状态</div>
        </button>
        <p className="text-base text-muted-foreground">保存后会在地图的节点上留下痕迹，点开随时回看。</p>
      </div>

      <div className="flex-1" />

      {/* 岔路口操作区 */}
      <div className="rounded-sketch bg-muted border-2 border-dashed border-border/50 p-4 flex flex-col gap-3">
        <p className="text-xl text-foreground font-hand">岔路口</p>
        <div className="flex gap-3">
          <button type="button" className="flex-1 press-sketch rounded-sketch bg-card border-2 border-primary" onClick={handleSupply}>
            <div className="py-2 flex flex-col items-center gap-1">
              <div className={`w-3.5 h-3.5 ${node.kind === 'supply' ? 'bg-primary' : 'border-2 border-primary'} rotate-45`} />
              <span className="text-lg text-foreground">{node.kind === 'supply' ? '撤掉补给站' : '休整一下'}</span>
            </div>
          </button>
          <button type="button" className="flex-1 press-sketch rounded-sketch bg-card border-2 border-primary" onClick={handleHibernate}>
            <div className="py-2 flex flex-col items-center gap-1">
              <div className={`${hibernate ? 'i-lucide-sun' : 'i-lucide-moon'} w-6 h-6 text-primary`} />
              <span className="text-lg text-foreground">{hibernate ? '唤醒这条支线' : '让这条支线冬眠'}</span>
            </div>
          </button>
        </div>
        {!hibernate && <p className="text-base text-muted-foreground">冬眠的支线会变成点线，不会有任何催促，随时唤醒。</p>}
      </div>
    </div>
  )
}
