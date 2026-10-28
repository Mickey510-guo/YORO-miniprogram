// @title 今日日记
import { useCallback, useEffect, useMemo, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { Image } from '@tarojs/components'
import { addDiary, getAllDoneNodes, getDiaries } from '@/db/api'
import type { Diary } from '@/db/types'
import { MOODS } from '@/db/types'
import { prettyDate, todayStr } from '@/utils/date'
import { selectMediaFiles, uploadToSupabase } from '@/utils/upload'
import { supabase } from '@/client/supabase'

const BUCKET = 'yoro_images'

export default function DiaryPage() {
  const [diaries, setDiaries] = useState<Diary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [mood, setMood] = useState('')
  // 待上传图片：weapp 用 tempFilePath 预览，H5 用 File
  const [pending, setPending] = useState<{ path: string; file: any }[]>([])
  const [uploading, setUploading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [todayDone, setTodayDone] = useState<{ name: string; content: string | null }[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setDiaries(await getDiaries())
      const nodes = await getAllDoneNodes()
      setTodayDone(nodes.filter((n) => n.done_date === todayStr()).slice(0, 8).map((n) => ({ name: n.name, content: n.done_content })))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useDidShow(() => { load() })

  async function handlePickImage() {
    try {
      const files = await selectMediaFiles({ mediaType: ['image'], count: 9 - pending.length })
      const list = Array.isArray(files) ? files : []
      if (list.length === 0) return
      setPending((p) => [...p, ...list.map((f: any) => ({ path: (f as any).tempFilePath ?? (f as any).path ?? '', file: f }))])
    } catch {
      Taro.showToast({ title: '选择图片失败', icon: 'none' })
    }
  }

  function removePending(i: number) {
    setPending((p) => p.filter((_, idx) => idx !== i))
  }

  async function uploadAll(): Promise<string[]> {
    const urls: string[] = []
    for (const item of pending) {
      const res = await uploadToSupabase(item.file, { bucket: BUCKET, userId: 'diary' })
      if (!res.success || !res.data) throw new Error(res.error || '上传失败')
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(res.data.path)
      urls.push(data.publicUrl)
    }
    return urls
  }

  async function handleSave() {
    if (!content.trim()) {
      Taro.showToast({ title: '写点什么再保存吧', icon: 'none' })
      return
    }
    setSaving(true)
    setUploading(pending.length > 0)
    try {
      const images = await uploadAll()
      await addDiary({ content: content.trim(), images, tags, mood: mood || null })
      setContent('')
      setTags([])
      setMood('')
      setPending([])
      Taro.showToast({ title: '日记已收好', icon: 'success' })
      await load()
    } catch {
      Taro.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  function handleAddTag() {
    const t = tagInput.trim()
    if (!t) return
    if (!tags.includes(t)) setTags((prev) => [...prev, t])
    setTagInput('')
  }

  const grouped = useMemo(() => diaries, [diaries])

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-5">
      {/* 日期 */}
      <div className="flex items-center gap-2">
        <div className="i-lucide-notebook-pen w-6 h-6 text-primary" />
        <p className="text-2xl font-hand text-foreground">{prettyDate(todayStr())}</p>
      </div>

      {/* 今天走过的节点 */}
      {todayDone.length > 0 && (
        <div className="rounded-sketch bg-card border-2 border-border/30 p-3 flex flex-col gap-1">
          <p className="text-base text-muted-foreground">今天走过的格子</p>
          <div className="flex flex-row flex-wrap gap-2">
            {todayDone.map((n, i) => (
              <span key={i} className="rounded-sketch bg-muted border border-border/40 px-2 py-0.5 text-base text-foreground">{n.content || n.name}</span>
            ))}
          </div>
        </div>
      )}

      {/* 编辑区 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-4 flex flex-col gap-4">
        <div className="rounded-sketch border-2 border-input bg-background px-4 py-3 overflow-hidden">
          <textarea
            className="w-full text-xl text-foreground bg-transparent outline-none"
            style={{ height: '18vh' }}
            placeholder="今天走过的路，写下来给以后的自己看"
            value={content}
            onInput={(e) => { const ev = e as any; setContent(ev.detail?.value ?? ev.target?.value ?? '') }}
          />
        </div>

        {/* 图片 */}
        <div className="flex flex-col gap-2">
          <p className="text-xl text-foreground">图片</p>
          <div className="flex flex-row flex-wrap gap-2">
            {pending.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-sketch-sm border-2 border-border/40 overflow-hidden">
                <Image src={p.path} mode="aspectFill" className="w-full h-full" />
                <button type="button" className="absolute top-0 right-0 bg-background/80 rounded-bl-lg w-7 h-7 flex items-center justify-center" onClick={() => removePending(i)}>
                  <div className="i-lucide-x w-4 h-4 text-foreground" />
                </button>
              </div>
            ))}
            {pending.length < 9 && (
              <button type="button" className="press-sketch w-20 h-20 rounded-sketch-sm border-2 border-dashed border-input bg-muted flex flex-col items-center justify-center gap-1" onClick={handlePickImage}>
                <div className="i-lucide-image-plus w-7 h-7 text-muted-foreground" />
                <span className="text-base text-muted-foreground">加图</span>
              </button>
            )}
          </div>
        </div>

        {/* 标签 */}
        <div className="flex flex-col gap-2">
          <p className="text-xl text-foreground">标签</p>
          <div className="flex flex-row flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t} className="rounded-sketch bg-muted border border-border/40 px-3 py-1 text-lg text-foreground flex items-center gap-1">
                {t}
                <button type="button" className="i-lucide-x w-4 h-4 text-muted-foreground" onClick={() => setTags((prev) => prev.filter((x) => x !== t))} />
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 rounded-sketch border-2 border-input bg-background px-3 py-2 overflow-hidden">
              <input
                className="w-full text-xl text-foreground bg-transparent outline-none"
                placeholder="加一个标签"
                value={tagInput}
                onInput={(e) => { const ev = e as any; setTagInput(ev.detail?.value ?? ev.target?.value ?? '') }}
              />
            </div>
            <button type="button" className="press-sketch rounded-sketch bg-muted border-2 border-border/40 px-4" onClick={handleAddTag}>
              <div className="text-xl text-foreground">加</div>
            </button>
          </div>
        </div>

        {/* 情绪 */}
        <div className="flex gap-2">
          {MOODS.map((m) => {
            const selected = m.key === mood
            return (
              <button key={m.key} type="button" className={`flex-1 press-sketch rounded-sketch border-2 py-1.5 flex flex-col items-center gap-0.5 ${selected ? 'bg-primary border-primary' : 'bg-background border-border/40'}`} onClick={() => setMood(selected ? '' : m.key)}>
                <div className={`${m.icon} w-5 h-5 ${selected ? 'text-primary-foreground' : 'text-foreground'}`} />
                <span className={`text-base ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{m.label}</span>
              </button>
            )
          })}
        </div>

        <button type="button" className={`press-sketch rounded-sketch ${saving ? 'bg-primary/50' : 'bg-primary'}`} onClick={handleSave}>
          <div className="py-2.5 text-xl text-primary-foreground font-hand">{uploading ? '图片上传中…' : saving ? '正在保存…' : '收好这篇日记'}</div>
        </button>
      </div>

      {/* 历史日记 */}
      <div className="flex flex-col gap-3 pb-6">
        <p className="text-xl text-foreground font-hand">过去的日记</p>
        {loading ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-xl text-muted-foreground">翻日记中…</p>
          </div>
        ) : grouped.length === 0 ? (
          <div className="rounded-sketch bg-card border-2 border-dashed border-border/50 p-6 flex flex-col items-center gap-2">
            <div className="i-lucide-notebook-pen w-12 h-12 text-muted-foreground" />
            <p className="text-xl text-muted-foreground">还没有日记，今天写第一篇</p>
          </div>
        ) : (
          grouped.map((d) => {
            const isOpen = expanded === d.id
            const moodInfo = MOODS.find((m) => m.key === d.mood)
            return (
              <div key={d.id} className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-2 press-sketch" onClick={() => setExpanded(isOpen ? null : d.id)}>
                <div className="flex items-center justify-between">
                  <span className="text-lg text-muted-foreground">{prettyDate(d.diary_date)}</span>
                  {moodInfo && (
                    <span className="flex items-center gap-1">
                      <div className={`${moodInfo.icon} w-4 h-4 text-primary`} />
                      <span className="text-base text-muted-foreground">{moodInfo.label}</span>
                    </span>
                  )}
                </div>
                <p className={`text-xl text-foreground leading-relaxed ${isOpen ? '' : 'overflow-hidden line-clamp-2'}`}>{d.content}</p>
                {d.images.length > 0 && (
                  <div className="flex flex-row flex-wrap gap-2 mt-1">
                    {d.images.slice(0, isOpen ? 9 : 3).map((img, i) => (
                      <Image key={i} src={img} mode="aspectFill" className="w-20 h-20 rounded-sketch-sm border-2 border-border/40" />
                    ))}
                  </div>
                )}
                {d.tags.length > 0 && (
                  <div className="flex flex-row flex-wrap gap-2">
                    {d.tags.map((t) => (
                      <span key={t} className="rounded-sketch bg-muted border border-border/40 px-2 py-0.5 text-base text-muted-foreground">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
