// 日期工具 —— 全部本地时区字符串 yyyy-MM-dd
export function todayStr(): string {
  const d = new Date()
  return fmt(d)
}

export function fmt(d: Date | string): string {
  const date = typeof d === 'string' ? parseDate(d) : d
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return fmt(d)
}

// 周一为一周开始
export function weekStart(s: string): string {
  const d = parseDate(s)
  const wd = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - wd)
  return fmt(d)
}

export function monthStart(s: string): string {
  const d = parseDate(s)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function daysBetween(a: string, b: string): number {
  const da = parseDate(a).getTime()
  const db = parseDate(b).getTime()
  return Math.round((db - da) / 86400000)
}

export function countdown(examDate: string): number {
  return daysBetween(todayStr(), examDate)
}

const WEEK_CN = ['日', '一', '二', '三', '四', '五', '六']

export function weekdayCN(s: string): string {
  return WEEK_CN[parseDate(s).getDay()]
}

export function prettyDate(s: string): string {
  const d = parseDate(s)
  return `${d.getMonth() + 1}月${d.getDate()}日 周${weekdayCN(s)}`
}

export function minutesToHM(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}:00` : `${h}:${String(m).padStart(2, '0')}`
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
