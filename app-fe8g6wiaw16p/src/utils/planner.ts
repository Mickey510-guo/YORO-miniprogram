// 路线生成器：按目标类型与剩余天数生成分阶段支线与节点（仅作用于本地草稿，确认后才落库）
import { daysBetween, todayStr, addDays } from './date'

export interface DraftNode {
  name: string
  weight: 'main' | 'side' | 'bypass'
  plan_date: string
  plan_start: string
  plan_end: string
}

export interface DraftBranch {
  name: string
  nodes: DraftNode[]
}

const PHASE_TEMPLATES: Record<string, string[]> = {
  基础: ['第{0}章过完', '第{0}章习题一遍', '错题过一遍'],
  强化: ['专题{0}过完', '往年卷一套', '重点背第一轮'],
  冲刺: ['真题掐表一套', '错题复盘一遍', '重点背第二轮'],
}

const SUGGEST_SLOTS = [
  ['09:00', '10:30'],
  ['14:00', '16:00'],
  ['15:00', '17:00'],
  ['19:00', '21:00'],
]

// 生成：每科按剩余天数分成 3 阶段，节点间隔随天数伸缩
export function generateDraft(subjects: string[], examDate: string): DraftBranch[] {
  const totalDays = Math.max(daysBetween(todayStr(), examDate), 14)
  const perBranch = Math.max(Math.min(Math.round(totalDays / 12), 14), 6)
  const gap = Math.max(Math.floor(totalDays / perBranch), 1)
  const phases = ['基础', '强化', '冲刺']
  const slotCount = SUGGEST_SLOTS.length

  return subjects.map((subject, bi) => {
    const nodes: DraftNode[] = []
    for (let i = 0; i < perBranch; i++) {
      const phase = phases[Math.min(Math.floor((i / perBranch) * 3), 2)]
      const tmpl = PHASE_TEMPLATES[phase][i % 3]
      const label = tmpl.replace('{0}', String(Math.floor(i / 3) + 1))
      const weight: DraftNode['weight'] = i % 5 === 4 ? 'side' : i % 7 === 6 ? 'bypass' : 'main'
      const slot = SUGGEST_SLOTS[(i + bi) % slotCount]
      nodes.push({
        name: `${subject}·${label}`,
        weight,
        plan_date: addDays(todayStr(), (i + 1) * gap),
        plan_start: slot[0],
        plan_end: slot[1],
      })
    }
    return { name: subject, nodes }
  })
}
