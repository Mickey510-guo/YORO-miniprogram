// @title 记一笔
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { getMainlineDetail, recordDone } from '@/db/api'
import type { MainlineDetail } from '@/db/types'
import { QUICK_TAGS, WEIGHTS } from '@/db/types'
import { prettyDate, todayStr } from '@/utils/date'

export default function Record() {
  const [mainlineId, setMainlineId] = useState('')
  const [detail, setDetail] = useState<MainlineDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [branchId, setBranchId] = useState('')
  const [content, setContent] = useState('')
  const [weight, setWeight] = useState<'main' | 'side' | 'bypass'>('main')
  const [errors, setErrors] = useState<{ branch?: string; content?: string }>({})

  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {}
    const ml = params.mainline || ''
    const br = params.branch || ''
    setMainlineId(ml)
    setBranchId(br)
  }, [])

  const load = useCallback(async () => {
    if (!mainlineId) return
    setLoading(true)
    try {
      const d = await getMainlineDetail(mainlineId)
      setDetail(d)
    } finally {
      setLoading(false)
    }
  }, [mainlineId])

  useEffect(() => { load() }, [load])
  useDidShow(() => { load() })

  const branches = useMemo(() => detail?.branches.filter((b) => b.status !== 'archived') ?? [], [detail])

  async function handleSave() {
    const errs: typeof errors = {}
    if (!branchId) errs.branch = '选一条支线再记'
    if (!content.trim()) errs.content = '写下今天做成了什么'
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      Taro.showToast({ title: Object.values(errs)[0], icon: 'none' })
      return
    }
    const branch = branches.find((b) => b.id === branchId)
    if (!branch) return
    setSaving(true)
    try {
      await recordDone(branch, content.trim(), weight)
      Taro.showToast({ title: '又走了一格', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        <p className="text-xl text-muted-foreground">正在取支线…</p>
      </div>
    )
  }

  if (!detail) {
    return (
      <div className="min-h-screen paper-texture flex flex-col items-center justify-center gap-3 px-8">
        <div className="i-lucide-map-off w-14 h-14 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">找不到这条主线</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-5">
      {/* 日期 */}
      <div className="flex items-center gap-2">
        <div className="i-lucide-calendar w-6 h-6 text-primary" />
        <p className="text-2xl font-hand text-foreground">{prettyDate(todayStr())}</p>
      </div>

      {/* 支线选择 */}
      <div className="flex flex-col gap-2">
        <p className="text-xl text-foreground">记到哪条支线</p>
        {errors.branch && <p className="text-base text-destructive">{errors.branch}</p>}
        {branches.length === 0 ? (
          <div className="rounded-sketch bg-muted border-2 border-dashed border-border/50 p-4 flex flex-col items-center gap-2">
            <p className="text-xl text-muted-foreground">这条主线还没有支线</p>
            <button type="button" className="press-sketch rounded-sketch bg-primary px-4 py-2" onClick={() => Taro.navigateTo({ url: '/pages/create-mainline/index' })}>
              <div className="text-lg text-primary-foreground">去新建主线</div>
            </button>
          </div>
        ) : (
          <div className="flex flex-row flex-wrap gap-2">
            {branches.map((b) => {
              const selected = b.id === branchId
              const hibernate = b.status === 'hibernate'
              return (
                <button
                  type="button"
                  key={b.id}
                  className={`press-sketch rounded-sketch border-2 px-4 py-2 flex items-center gap-1 ${selected ? 'bg-primary border-primary shadow-sketch-sm' : 'bg-card border-border/40'}`}
                  onClick={() => setBranchId(b.id)}
                >
                  {b.type === 'habit' && <div className={`i-lucide-footprints w-5 h-5 ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />}
                  <span className={`text-xl ${selected ? 'text-primary-foreground' : hibernate ? 'text-muted-foreground' : 'text-foreground'}`}>{b.name}</span>
                  {hibernate && !selected && <span className="text-base text-muted-foreground">·冬眠</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 完成内容 */}
      <div className="flex flex-col gap-2">
        <p className="text-xl text-foreground">今天做成了什么</p>
        {errors.content && <p className="text-base text-destructive">{errors.content}</p>}
        <div className="rounded-sketch border-2 border-input bg-card px-4 py-3 overflow-hidden">
          <textarea
            className="w-full text-xl text-foreground bg-transparent outline-none"
            style={{ height: '20vh' }}
            placeholder="例如：高数第三章过完，课后题全对"
            value={content}
            onInput={(e) => { const ev = e as any; setContent(ev.detail?.value ?? ev.target?.value ?? '') }}
          />
        </div>
        <div className="flex flex-row flex-wrap gap-2">
          {QUICK_TAGS.map((t) => (
            <button key={t} type="button" className="press-sketch rounded-sketch bg-muted border-2 border-border/30 px-3 py-1" onClick={() => setContent((c) => (c ? `${c} ${t}` : t))}>
              <span className="text-lg text-foreground">{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 分量标记 */}
      <div className="flex flex-col gap-2">
        <p className="text-xl text-foreground">这一笔的分量</p>
        <p className="text-base text-muted-foreground">只影响节点在地图上的大小与线型</p>
        <div className="flex gap-2">
          {WEIGHTS.map((w) => {
            const selected = w.key === weight
            return (
              <button
                type="button"
                key={w.key}
                className={`flex-1 press-sketch rounded-sketch border-2 py-2 ${selected ? 'bg-primary border-primary' : 'bg-card border-border/40'}`}
                onClick={() => setWeight(w.key)}
              >
                <span className={`text-xl ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{w.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1" />

      {/* 保存 */}
      <button
        type="button"
        className={`press-sketch rounded-sketch w-full shadow-sketch ${saving ? 'bg-primary/50' : 'bg-primary'}`}
        onClick={handleSave}
      >
        <div className="py-3 text-2xl text-primary-foreground font-hand">{saving ? '正在记录…' : '保存这一笔'}</div>
      </button>
    </div>
  )
}
