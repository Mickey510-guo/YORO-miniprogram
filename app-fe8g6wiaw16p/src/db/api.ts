// YORO 数据访问层 —— 所有 Supabase 查询的唯一出口
import { supabase } from '@/client/supabase'
import type { Branch, Diary, Footprint, Mainline, MainlineDetail, NodeItem, Substep } from './types'
import { todayStr } from '@/utils/date'

function asArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : []
}

// ---------- 主线 ----------
export async function getMainlines(includeArchived = false): Promise<Mainline[]> {
  let q = supabase.from('mainlines').select('*').order('order_index')
  if (!includeArchived) q = q.eq('archived', false)
  const { data, error } = await q
  if (error) throw error
  return asArray<Mainline>(data)
}

export async function getMainlineDetail(id: string): Promise<MainlineDetail | null> {
  const { data, error } = await supabase.from('mainlines').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  const mainline = data as Mainline
  const { data: bData, error: bErr } = await supabase
    .from('branches')
    .select('*')
    .eq('mainline_id', id)
    .order('order_index')
  if (bErr) throw bErr
  const branches = asArray<Branch>(bData).filter((b) => b.status !== 'archived')
  if (branches.length === 0) return { ...mainline, branches: [] }
  const ids = branches.map((b) => b.id)
  const { data: nData, error: nErr } = await supabase
    .from('nodes')
    .select('*')
    .in('branch_id', ids)
    .order('order_index')
  if (nErr) throw nErr
  const nodes = asArray<NodeItem>(nData)
  const { data: fData, error: fErr } = await supabase
    .from('footprints')
    .select('id, branch_id, footprint_date')
    .in('branch_id', ids)
  if (fErr) throw fErr
  const footprints = asArray<Footprint>(fData)
  return {
    ...mainline,
    branches: branches.map((b) => ({
      ...b,
      nodes: nodes.filter((n) => n.branch_id === b.id),
      footprints: footprints.filter((f) => f.branch_id === b.id).map((f) => f.footprint_date),
    })),
  }
}

export async function archiveMainline(id: string, archived: boolean): Promise<void> {
  const { error } = await supabase.from('mainlines').update({ archived }).eq('id', id)
  if (error) throw error
}

export async function createMainline(payload: {
  name: string
  category: string
  exam_date: string
  goal_desc: string
  subjects: string[]
}): Promise<string> {
  const { data: existing } = await supabase.from('mainlines').select('order_index').order('order_index', { ascending: false }).limit(1)
  const nextIdx = asArray<{ order_index: number }>(existing)[0]?.order_index ?? -1
  const { data, error } = await supabase
    .from('mainlines')
    .insert({ name: payload.name, category: payload.category, exam_date: payload.exam_date, goal_desc: payload.goal_desc, order_index: nextIdx + 1 })
    .select('id')
    .maybeSingle()
  if (error || !data) throw error ?? new Error('创建主线失败')
  return (data as { id: string }).id
}

// ---------- 支线 ----------
export async function setBranchStatus(branchId: string, status: 'active' | 'hibernate'): Promise<void> {
  const { error } = await supabase.from('branches').update({ status }).eq('id', branchId)
  if (error) throw error
}

export async function updateBranchRule(branchId: string, repeat_rule: 'daily' | 'weekly'): Promise<void> {
  const { error } = await supabase.from('branches').update({ repeat_rule }).eq('id', branchId)
  if (error) throw error
}

export async function archiveBranch(branchId: string): Promise<void> {
  const { error } = await supabase.from('branches').update({ status: 'archived' }).eq('id', branchId)
  if (error) throw error
}

export async function createBranches(mainlineId: string, items: { name: string; type: 'subject' | 'habit'; repeat_rule?: 'daily' | 'weekly' }[]): Promise<void> {
  if (items.length === 0) return
  const { data: existing } = await supabase.from('branches').select('order_index').eq('mainline_id', mainlineId).order('order_index', { ascending: false }).limit(1)
  const base = asArray<{ order_index: number }>(existing)[0]?.order_index ?? -1
  const rows = items.map((it, i) => ({
    mainline_id: mainlineId,
    name: it.name,
    type: it.type,
    repeat_rule: it.repeat_rule ?? 'daily',
    order_index: base + 1 + i,
  }))
  const { error } = await supabase.from('branches').insert(rows)
  if (error) throw error
}

// ---------- 记一笔 ----------
export async function recordDone(
  branch: Branch,
  content: string,
  weight: 'main' | 'side' | 'bypass'
): Promise<void> {
  const today = todayStr()
  if (branch.type === 'habit') {
    const { error } = await supabase.from('footprints').insert({ branch_id: branch.id, footprint_date: today })
    if (error) throw error
  } else {
    const { data } = await supabase
      .from('nodes')
      .select('order_index')
      .eq('branch_id', branch.id)
      .order('order_index', { ascending: false })
      .limit(1)
    const nextIdx = asArray<{ order_index: number }>(data)[0]?.order_index ?? -1
    const { error } = await supabase.from('nodes').insert({
      branch_id: branch.id,
      name: content,
      weight,
      kind: 'normal',
      status: 'done',
      done_date: today,
      done_content: content,
      order_index: nextIdx + 1,
    })
    if (error) throw error
  }
  const { error: bErr } = await supabase.from('branches').update({ last_record_at: today }).eq('id', branch.id)
  if (bErr) throw bErr
}

// ---------- 节点 ----------
export async function getNode(nodeId: string): Promise<NodeItem | null> {
  const { data, error } = await supabase.from('nodes').select('*').eq('id', nodeId).maybeSingle()
  if (error || !data) return null
  return data as NodeItem
}

export async function getNodeWithBranch(nodeId: string): Promise<{ node: NodeItem; branch: Branch } | null> {
  const node = await getNode(nodeId)
  if (!node) return null
  const { data, error } = await supabase.from('branches').select('*').eq('id', node.branch_id).maybeSingle()
  if (error || !data) return null
  return { node, branch: data as Branch }
}

export async function updateNode(id: string, patch: Partial<NodeItem>): Promise<void> {
  const { error } = await supabase.from('nodes').update(patch).eq('id', id)
  if (error) throw error
}

export async function updatePlan(id: string, plan: { plan_date: string; plan_start: string; plan_end: string }): Promise<void> {
  const { error } = await supabase.from('nodes').update(plan).eq('id', id)
  if (error) throw error
}

export async function batchInsertNodes(
  rows: { branch_id: string; name: string; weight: string; plan_date: string; plan_start: string; plan_end: string; order_index: number }[]
): Promise<void> {
  if (rows.length === 0) return
  const { error } = await supabase.from('nodes').insert(rows)
  if (error) throw error
}

export async function deleteNode(id: string): Promise<void> {
  const { error } = await supabase.from('nodes').delete().eq('id', id)
  if (error) throw error
}

// ---------- 子步骤 ----------
export async function getSubsteps(nodeId: string): Promise<Substep[]> {
  const { data, error } = await supabase.from('substeps').select('*').eq('node_id', nodeId).order('order_index')
  if (error) throw error
  return asArray<Substep>(data)
}

export async function addSubstep(nodeId: string, content: string): Promise<void> {
  const { data } = await supabase.from('substeps').select('order_index').eq('node_id', nodeId).order('order_index', { ascending: false }).limit(1)
  const nextIdx = asArray<{ order_index: number }>(data)[0]?.order_index ?? -1
  const { error } = await supabase.from('substeps').insert({ node_id: nodeId, content, order_index: nextIdx + 1 })
  if (error) throw error
}

export async function toggleSubstep(id: string, checked: boolean): Promise<void> {
  const { error } = await supabase.from('substeps').update({ checked }).eq('id', id)
  if (error) throw error
}

export async function deleteSubstep(id: string): Promise<void> {
  const { error } = await supabase.from('substeps').delete().eq('id', id)
  if (error) throw error
}

// ---------- 日记 ----------
export async function getDiaries(): Promise<Diary[]> {
  const { data, error } = await supabase.from('diaries').select('*').order('diary_date', { ascending: false }).limit(50)
  if (error) throw error
  return asArray<Diary>(data)
}

export async function addDiary(payload: { content: string; images: string[]; tags: string[]; mood?: string | null }): Promise<void> {
  const { error } = await supabase.from('diaries').insert({
    diary_date: todayStr(),
    content: payload.content,
    images: payload.images,
    tags: payload.tags,
    mood: payload.mood ?? null,
  })
  if (error) throw error
}

// ---------- 习惯 ----------
export async function getHabitBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from('branches').select('*').eq('type', 'habit').order('order_index')
  if (error) throw error
  return asArray<Branch>(data).filter((b) => b.status !== 'archived')
}

export async function getFootprints(branchIds: string[]): Promise<Footprint[]> {
  if (branchIds.length === 0) return []
  const { data, error } = await supabase.from('footprints').select('*').in('branch_id', branchIds)
  if (error) throw error
  return asArray<Footprint>(data)
}

export async function addFootprint(branchId: string): Promise<void> {
  const { error } = await supabase.from('footprints').insert({ branch_id: branchId, footprint_date: todayStr() })
  if (error) throw error
  await supabase.from('branches').update({ last_record_at: todayStr() }).eq('id', branchId)
}

// ---------- 看板 ----------
export async function getAllDoneNodes(): Promise<NodeItem[]> {
  const { data, error } = await supabase.from('nodes').select('*').eq('status', 'done').order('done_date', { ascending: false }).limit(500)
  if (error) throw error
  return asArray<NodeItem>(data)
}

export async function getAllBranches(): Promise<Branch[]> {
  const { data, error } = await supabase.from('branches').select('*').order('order_index')
  if (error) throw error
  return asArray<Branch>(data).filter((b) => b.status !== 'archived')
}

export async function getNodesOfBranch(branchId: string): Promise<NodeItem[]> {
  const { data, error } = await supabase.from('nodes').select('*').eq('branch_id', branchId).order('order_index')
  if (error) throw error
  return asArray<NodeItem>(data)
}
