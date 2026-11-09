// YORO 数据类型 —— 与 Supabase schema 严格对应
export interface Mainline {
  id: string
  name: string
  category: string
  exam_date: string
  goal_desc: string
  archived: boolean
  order_index: number
}

export type BranchType = 'subject' | 'habit'
export type BranchStatus = 'active' | 'hibernate' | 'archived'

export interface Branch {
  id: string
  mainline_id: string
  name: string
  type: BranchType
  status: BranchStatus
  repeat_rule: 'daily' | 'weekly'
  order_index: number
  last_record_at: string | null
}

export type NodeWeight = 'main' | 'side' | 'bypass'

export interface NodeItem {
  id: string
  branch_id: string
  name: string
  weight: NodeWeight
  kind: 'normal' | 'supply'
  is_crossing: boolean
  plan_date: string | null
  plan_start: string | null
  plan_end: string | null
  done_date: string | null
  done_content: string | null
  status: 'done' | 'planned'
  mood: string | null
  mood_note: string | null
  order_index: number
}

export interface Substep {
  id: string
  node_id: string
  content: string
  checked: boolean
  order_index: number
}

export interface Diary {
  id: string
  diary_date: string
  content: string
  images: string[]
  tags: string[]
  mood: string | null
}

export interface Footprint {
  id: string
  branch_id: string
  footprint_date: string
}

// 地图渲染用的聚合结构
export interface BranchWithDetail extends Branch {
  nodes: NodeItem[]
  footprints: string[]
}

export interface MainlineDetail extends Mainline {
  branches: BranchWithDetail[]
}

export const MOODS = [
  { key: 'anxious', label: '焦虑', icon: 'i-lucide-cloud-drizzle' },
  { key: 'calm', label: '平静', icon: 'i-lucide-feather' },
  { key: 'energized', label: '有劲', icon: 'i-lucide-flame' },
  { key: 'low', label: '低落', icon: 'i-lucide-cloud-rain' },
] as const

export const WEIGHTS = [
  { key: 'main', label: '主道' },
  { key: 'side', label: '便道' },
  { key: 'bypass', label: '旁路' },
] as const

export const QUICK_TAGS = ['过完一章', '一套卷', '背诵一轮', '错题复盘']
