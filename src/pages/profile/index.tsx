// @title 我的
import { useCallback, useEffect, useState } from 'react'
import Taro, { useDidShow } from '@tarojs/taro'
import { archiveMainline, getAllBranches, getMainlines } from '@/db/api'
import type { Branch, Mainline } from '@/db/types'
import { countdown, fmt, todayStr } from '@/utils/date'
import { supabase } from '@/client/supabase'

function buildIcs(mainlines: Mainline[], nodes: { name: string; plan_date: string; plan_start: string; plan_end: string }[]): string {
  const dt = (d: string, t?: string) => `${d.replace(/-/g, '')}T${(t ?? '09:00').replace(':', '')}00`
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YORO//Plan Export//CN',
    'CALSCALE:GREGORIAN',
  ]
  nodes.forEach((n, i) => {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:yoro-node-${i}@yoro`)
    lines.push(`DTSTART:${dt(n.plan_date, n.plan_start)}`)
    lines.push(`DTEND:${dt(n.plan_date, n.plan_end)}`)
    lines.push(`SUMMARY:${n.name}`)
    lines.push('END:VEVENT')
  })
  mainlines.forEach((m, i) => {
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:yoro-exam-${i}@yoro`)
    lines.push(`DTSTART;VALUE=DATE:${m.exam_date.replace(/-/g, '')}`)
    lines.push(`DTEND;VALUE=DATE:${fmt(new Date(new Date(m.exam_date).getTime() + 86400000)).replace(/-/g, '')}`)
    lines.push(`SUMMARY:${m.name} · 考试日`)
    lines.push('END:VEVENT')
  })
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export default function Profile() {
  const [lines, setLines] = useState<Mainline[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [nickname, setNickname] = useState('轻登录 · 未授权')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setLines(await getMainlines(true))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])
  useDidShow(() => { load() })

  useEffect(() => {
    // 轻登录状态展示
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email
      if (email) setNickname(`已登录 · ${email.slice(0, 12)}`)
      else setNickname('轻登录 · 未授权')
    }).catch(() => {})
  }, [])

  async function handleArchive(m: Mainline) {
    try {
      await archiveMainline(m.id, !m.archived)
      await load()
      Taro.showToast({ title: m.archived ? '已恢复' : '已归档', icon: 'success' })
    } catch {
      Taro.showToast({ title: '操作失败', icon: 'none' })
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const allLines = await getMainlines(true)
      const branches: Branch[] = await getAllBranches()
      const nodeRows: { name: string; plan_date: string; plan_start: string; plan_end: string }[] = []
      for (const b of branches) {
        const { data } = await supabase.from('nodes').select('name, plan_date, plan_start, plan_end').eq('branch_id', b.id).eq('status', 'planned').not('plan_date', 'is', null)
        if (Array.isArray(data)) nodeRows.push(...(data as typeof nodeRows))
      }
      const ics = buildIcs(allLines, nodeRows)
      if (Taro.getEnv() === 'WEAPP') {
        const fs = Taro.getFileSystemManager()
        const path = `${Taro.env.USER_DATA_PATH}/yoro-plan.ics`
        fs.writeFileSync(path, ics, 'utf8')
        Taro.showToast({ title: `已导出 ${nodeRows.length} 个计划`, icon: 'success' })
        Taro.shareFileMessage({ filePath: path, fileName: 'yoro-plan.ics' }).catch(() => {})
      } else {
        // H5：用锚点下载
        const blob = new Blob([ics], { type: 'text/calendar' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'yoro-plan.ics'
        a.click()
        URL.revokeObjectURL(url)
        Taro.showToast({ title: '已导出日历文件', icon: 'success' })
      }
    } catch {
      Taro.showToast({ title: '导出失败，请重试', icon: 'none' })
    } finally {
      setExporting(false)
    }
  }

  const active = lines.filter((l) => !l.archived)
  const archived = lines.filter((l) => l.archived)

  return (
    <div className="min-h-screen paper-texture flex flex-col px-4 py-4 gap-5 border-none border-[rgb(229,231,235)] border-[0px] bg-[#f6efdc] bg-none border-[rgb(229,231,235)]">
      {/* 头部 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm p-4 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-muted border-2 border-primary flex items-center justify-center">
          <div className="i-lucide-user w-8 h-8 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-xl text-foreground font-hand">{nickname}</p>
          <p className="text-base text-muted-foreground">所有内容仅你可见</p>
        </div>
      </div>
      {/* 主线列表 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 p-4 flex flex-col gap-3">
        <p className="text-xl text-foreground font-hand">我的主线</p>
        {loading && <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin self-center" />}
        {!loading && active.length === 0 && <p className="text-xl text-muted-foreground">还没有主线，去新建一条</p>}
        {active.map((m) => (
          <div key={m.id} className="rounded-sketch bg-background border-2 border-border/40 p-3 flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-lg text-foreground">{m.name}</span>
              <span className="text-base text-muted-foreground">考试日 {m.exam_date} · {countdown(m.exam_date)} 天</span>
            </div>
            <button type="button" className="press-sketch rounded-sketch bg-muted border-2 border-border/40 px-3 py-1" onClick={() => handleArchive(m)}>
              <span className="text-base text-muted-foreground">归档</span>
            </button>
          </div>
        ))}
        {archived.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-base text-muted-foreground">已归档（仍可回看）</p>
            {archived.map((m) => (
              <div key={m.id} className="rounded-sketch bg-muted border-2 border-dashed border-border/50 p-3 flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-lg text-muted-foreground">{m.name}</span>
                  <span className="text-base text-muted-foreground">考试日 {m.exam_date}</span>
                </div>
                <button type="button" className="press-sketch rounded-sketch bg-card border-2 border-border/40 px-3 py-1" onClick={() => handleArchive(m)}>
                  <span className="text-base text-foreground">恢复</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 入口列表 */}
      <div className="rounded-sketch bg-card border-2 border-border/30 p-2 flex flex-col">
        {[
          { icon: 'i-lucide-library', title: '起点模板库', desc: '按考试类型一键导入', url: '/pages/templates/index' },
          { icon: 'i-lucide-hourglass', title: '静默计时', desc: '免打扰，时间不进地图', url: '/pages/timer/index' },
          { icon: 'i-lucide-calendar-down', title: '导出到日历', desc: '计划带起止时刻，考试日为全天', action: 'export' as const },
          { icon: 'i-lucide-map', title: '示例地图', desc: '看看一条完整的备考路线', url: '/pages/templates/index?demo=1' },
        ].map((item) => (
          <button key={item.title} type="button" className="press-sketch rounded-sketch-sm flex items-center gap-3 px-3 py-3" onClick={() => (item.action === 'export' ? handleExport() : Taro.navigateTo({ url: item.url! }))}>
            <div className={`${item.icon} w-7 h-7 text-primary flex-none`} />
            <div className="flex-1 flex flex-col items-start gap-0.5 border-none border-[rgb(229,231,235)] border-[0px] bg-[#ffffff00] bg-none border-[rgb(229,231,235)]">
              <span className="text-xl text-foreground">{item.title}</span>
              <span className="text-base text-muted-foreground">{item.desc}</span>
            </div>
            <div className="i-lucide-chevron-right w-5 h-5 text-muted-foreground flex-none" />
          </button>
        ))}
      </div>
      {/* 皮肤与版本 */}
      <div className="rounded-sketch bg-muted border-2 border-dashed border-border/50 p-4 flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-primary border border-ink" />
          <span className="text-lg text-foreground">当前皮肤：纸地图 · 墨绿</span>
        </div>
        <span className="text-base text-muted-foreground">{fmt(todayStr())}</span>
      </div>
      {exporting && (
        <div className="fixed inset-0 z-50 bg-foreground/40 flex items-center justify-center">
          <div className="rounded-sketch bg-background border-2 border-primary shadow-sketch px-6 py-4 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <span className="text-lg text-foreground">正在生成日历文件…</span>
          </div>
        </div>
      )}
    </div>
  );
}
