// 成长路线图 —— DOM/CSS 静态景深，玻璃小球节点
// 已走=浅蓝填充 / 在走=淡粉柔光 / 未走=浅灰空心；低饱和灰蓝连线；点击仅轻微提亮
import { useMemo, useState } from 'react'
import { ScrollView } from '@tarojs/components'
import type { BranchWithDetail, MainlineDetail, NodeItem } from '@/db/types'
import { fmt } from '@/utils/date'

interface Props {
  detail: MainlineDetail
  onNodeClick?: (nodeId: string) => void
  readOnly?: boolean
}

type NodeState = 'done' | 'active' | 'locked'

const BALL_CLASS: Record<NodeState, string> = {
  done: 'ball-done',
  active: 'ball-active',
  locked: 'ball-locked',
}

interface Enriched {
  node: NodeItem
  state: NodeState
}

function analyze(branch: BranchWithDetail) {
  const sorted = [...branch.nodes].sort((a, b) => a.order_index - b.order_index)
  const hibernate = branch.status === 'hibernate'
  let frontierSet = false
  const enriched: Enriched[] = sorted.map((node) => {
    let state: NodeState
    if (hibernate) state = 'locked'
    else if (node.status === 'done') state = 'done'
    else if (!frontierSet) {
      frontierSet = true
      state = 'active'
    } else {
      state = 'locked'
    }
    return { node, state }
  })
  const doneCount = sorted.filter((n) => n.status === 'done').length
  const hasActive = enriched.some((e) => e.state === 'active')
  return { enriched, doneCount, hasActive, hibernate, total: sorted.length }
}

export default function Roadmap({ detail, onNodeClick, readOnly }: Props) {
  const branches = useMemo(
    () => detail.branches.filter((b) => b.type === 'subject' && b.status !== 'archived'),
    [detail]
  )

  const analyzed = useMemo(() => branches.map((b) => ({ branch: b, ...analyze(b) })), [branches])

  // 默认展开「当前阶段」（含有在走节点的支线）；若都没有则展开第一条
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const init = new Set<string>()
    const activeBranches = analyzed.filter((a) => a.hasActive).map((a) => a.branch.id)
    if (activeBranches.length > 0) activeBranches.forEach((id) => init.add(id))
    else if (analyzed.length > 0) init.add(analyzed[0].branch.id)
    return init
  })
  const [openNode, setOpenNode] = useState<string | null>(null)

  function toggleBranch(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function tapNode(nodeId: string) {
    setOpenNode((prev) => (prev === nodeId ? null : nodeId))
  }

  return (
    <div className="glass rounded-sketch-lg overflow-hidden">
      {/* 主线：最近平面 · 终点 */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-primary/12 border border-primary/30 flex items-center justify-center flex-none">
          <div className="i-lucide-flag w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-hand text-foreground truncate">{detail.name}</p>
          <p className="text-base text-muted-foreground">终点 {detail.exam_date}</p>
        </div>
      </div>

      {/* 支线：按深度往后铺（静态景深，无动画） */}
      <div style={{ perspective: '1200px' }} className="px-3 pb-2 flex flex-col gap-3">
        {analyzed.map((a, idx) => {
          const isOpen = expanded.has(a.branch.id)
          const scale = Math.max(0.9, 1 - idx * 0.03)
          const opacity = Math.max(0.72, 1 - idx * 0.07)
          return (
            <div
              key={a.branch.id}
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center', opacity }}
              className="rounded-sketch bg-card border border-border/50 shadow-sketch-sm overflow-hidden"
            >
              {/* 支线头 */}
              <button
                type="button"
                className="press-sketch w-full flex items-center gap-2 px-3 py-3"
                onClick={() => toggleBranch(a.branch.id)}
              >
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <span className="text-xl text-foreground truncate">{a.branch.name}</span>
                  {a.hibernate ? (
                    <span className="text-sm text-muted-foreground border border-border rounded-full px-2 py-0.5 flex-none">冬眠</span>
                  ) : a.hasActive ? (
                    <span className="text-sm text-accent-foreground bg-accent/40 rounded-full px-2 py-0.5 flex-none">在走</span>
                  ) : null}
                </div>
                <span className="text-base text-muted-foreground flex-none">{a.doneCount}/{a.total}</span>
                <div className={`i-lucide-chevron-down w-5 h-5 text-muted-foreground flex-none transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* 节点轨道 */}
              {isOpen && (
                <div className="px-3 pb-3">
                  {a.enriched.length === 0 ? (
                    <p className="text-base text-muted-foreground py-2">这条支线还没有节点</p>
                  ) : (
                    <ScrollView scrollY style={{ maxHeight: a.enriched.length > 5 ? '360px' : 'auto' }} showScrollbar={false}>
                      <div className="relative pl-7">
                        {/* 低饱和浅灰蓝连线 */}
                        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-[hsl(var(--node-line))]" />
                        <div className="flex flex-col gap-3">
                          {a.enriched.map(({ node, state }) => {
                            const open = openNode === node.id
                            const label = node.status === 'done' ? node.done_content || node.name : node.name
                            const clampStyle = open
                              ? undefined
                              : ({ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' } as React.CSSProperties)
                            return (
                              <div key={node.id} className="flex items-start gap-3 min-h-[44px]">
                                <div
                                  className={`w-6 h-6 rounded-full flex-none mt-0.5 press-sketch ${BALL_CLASS[state]} ${open ? 'brightness-110' : ''}`}
                                  onClick={() => tapNode(node.id)}
                                />
                                <div className="flex-1 min-w-0">
                                  <button
                                    type="button"
                                    className="w-full text-left"
                                    onClick={() => tapNode(node.id)}
                                  >
                                    <p
                                      className={`text-lg leading-snug ${state === 'locked' && !a.hibernate ? 'text-muted-foreground' : 'text-foreground'}`}
                                      style={clampStyle}
                                    >
                                      {label}
                                    </p>
                                    {node.plan_date && (
                                      <p className="text-sm text-muted-foreground mt-0.5">
                                        {fmt(node.plan_date)}
                                        {node.plan_start ? ` ${node.plan_start.slice(0, 5)}-${node.plan_end?.slice(0, 5)}` : ''}
                                      </p>
                                    )}
                                  </button>
                                  {open && (
                                    <div className="mt-2 rounded-sketch-sm bg-background/70 border border-border/50 p-3 animate-sketch-in">
                                      <p className="text-base text-foreground leading-relaxed">{label}</p>
                                      {node.done_content && node.done_content !== node.name && (
                                        <p className="text-sm text-muted-foreground mt-1">做成了：{node.done_content}</p>
                                      )}
                                      {!readOnly && onNodeClick && (
                                        <button
                                          type="button"
                                          className="press-sketch mt-2 rounded-sketch-sm bg-primary px-3 py-1.5"
                                          onClick={() => onNodeClick(node.id)}
                                        >
                                          <span className="text-base text-primary-foreground">查看这一格</span>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </ScrollView>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 图例（去打卡化）+ 静默提示 */}
      <div className="px-4 pb-4 pt-1 border-t border-border/40">
        <div className="flex flex-wrap gap-x-4 gap-y-2 mb-2">
          <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full ball-done inline-block" /><span className="text-base text-muted-foreground">已走</span></div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full ball-active inline-block" /><span className="text-base text-muted-foreground">在走</span></div>
          <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full ball-locked inline-block" /><span className="text-base text-muted-foreground">未走</span></div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">每一格是你走过的路，不是连续打卡，歇几天也没关系。</p>
      </div>
    </div>
  )
}
