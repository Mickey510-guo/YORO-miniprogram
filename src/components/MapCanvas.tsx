// 手绘风格成长地图 —— Canvas 2D 绘制
// 实线=已走 / 虚线=未走 / 点线=冬眠；菱形=补给站；粗描边圆环=岔路口
// 主道节点大线粗 / 便道中等线细 / 旁路小且虚线
import { useEffect, useRef } from 'react'
import Taro from '@tarojs/taro'
import type { MainlineDetail, NodeItem } from '@/db/types'

interface Props {
  detail: MainlineDetail
  onNodeClick: (nodeId: string) => void
}

interface HitCircle {
  x: number
  y: number
  r: number
  id: string
}

const INK = '#2F4F3F'
const INK_LIGHT = 'rgba(47,79,63,0.35)'
const RED = '#FF4D4D'

// 基础 y 坐标（CSS 像素，画布宽 343，高按支线数自适应）
const TOP = 60
const LINE_GAP = 104

export default function MapCanvas({ detail, onNodeClick }: Props) {
  const canvasId = useRef(`map${Math.floor(Math.random() * 100000)}`)
  const hitsRef = useRef<HitCircle[]>([])
  const sizeRef = useRef({ w: 343, h: 400 })

  useEffect(() => {
    const timer = setTimeout(() => {
      try { draw() } catch (e) {
        console.error('map draw failed', e)
      }
    }, 80)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail])

  async function draw() {
    const query = Taro.createSelectorQuery()
    const res = await new Promise<any[]>((resolve) => {
      query.select(`#${canvasId.current}`).fields({ node: true, size: true, rect: true }).exec(resolve)
    })
    const item = res && res[0]
    if (!item || !item.node) return
    const canvas = item.node as HTMLCanvasElement
    let cssW = 343
    let cssH = 400
    if (Taro.getEnv() === 'WEAPP') {
      cssW = item.width || 343
      cssH = item.height || 400
    } else {
      const rect = (canvas as any).getBoundingClientRect?.()
      if (rect && rect.width) { cssW = rect.width; cssH = rect.height }
    }
    sizeRef.current = { w: cssW, h: cssH }
    const dpr = Taro.getSystemInfoSync().pixelRatio || 2
    canvas.width = Math.round(cssW * dpr)
    canvas.height = Math.round(cssH * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, cssW, cssH)
    const hits: HitCircle[] = []

    const subjects = detail.branches.filter((b) => b.type === 'subject')
    if (subjects.length === 0) return

    // ---------- 主线（顶部粗横线 + 终点旗） ----------
    const mainY = 34
    ctx.save()
    ctx.strokeStyle = INK
    ctx.lineWidth = 3
    ctx.setLineDash([])
    ctx.beginPath()
    ctx.moveTo(16, mainY)
    ctx.lineTo(cssW - 44, mainY)
    ctx.stroke()
    // 终点小旗
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.moveTo(cssW - 44, mainY - 16)
    ctx.lineTo(cssW - 44, mainY + 6)
    ctx.stroke()
    ctx.fillStyle = RED
    ctx.beginPath()
    ctx.moveTo(cssW - 44, mainY - 16)
    ctx.lineTo(cssW - 24, mainY - 11)
    ctx.lineTo(cssW - 44, mainY - 6)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = INK
    ctx.font = '600 13px sans-serif'
    ctx.fillText('终点', cssW - 60, mainY + 24)
    ctx.font = '600 15px sans-serif'
    ctx.fillText(detail.name, 16, mainY - 12)
    ctx.restore()

    // ---------- 支线 ----------
    subjects.forEach((branch, bi) => {
      const y = TOP + bi * LINE_GAP
      const hibernate = branch.status === 'hibernate'
      const doneNodes = branch.nodes.filter((n) => n.status === 'done')
      const plannedNodes = branch.nodes.filter((n) => n.status === 'planned')
      const allNodes = [...doneNodes, ...plannedNodes]
      if (allNodes.length === 0) {
        ctx.save()
        ctx.fillStyle = INK
        ctx.font = '600 15px sans-serif'
        ctx.fillText(branch.name, 16, y - 18)
        ctx.strokeStyle = INK_LIGHT
        ctx.lineWidth = 1.5
        ctx.setLineDash([2, 5])
        ctx.beginPath()
        ctx.moveTo(16, y)
        ctx.lineTo(cssW - 16, y)
        ctx.stroke()
        ctx.restore()
        return
      }

      // 节点横向布局：等分，节点大小按分量
      const padX = 26
      const usable = cssW - padX * 2
      const step = allNodes.length > 1 ? usable / (allNodes.length - 1) : 0
      const xs = allNodes.map((_, i) => (allNodes.length > 1 ? padX + i * step : cssW / 2))

      // 支线名称
      ctx.save()
      ctx.fillStyle = hibernate ? INK_LIGHT : INK
      ctx.font = '600 15px sans-serif'
      ctx.fillText(`${branch.name}${hibernate ? ' · 冬眠中' : ''}`, 16, y - 24)
      ctx.restore()

      // 逐段画线
      for (let i = 0; i < allNodes.length - 1; i++) {
        const leftDone = allNodes[i].status === 'done'
        ctx.save()
        ctx.strokeStyle = hibernate ? INK_LIGHT : leftDone ? INK : INK_LIGHT
        ctx.lineWidth = 2.2
        if (hibernate) ctx.setLineDash([1.5, 6])
        else if (!leftDone) ctx.setLineDash([7, 5])
        else ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(xs[i], y)
        ctx.lineTo(xs[i + 1], y)
        ctx.stroke()
        ctx.restore()
      }

      // 画节点
      allNodes.forEach((node, i) => {
        drawNode(ctx, xs[i], y, node, hibernate, hits)
        // 标注：完成内容（done）或节点名（planned）
        ctx.save()
        const label = node.status === 'done' ? (node.done_content || node.name) : node.name
        ctx.fillStyle = hibernate ? INK_LIGHT : node.status === 'done' ? INK : INK_LIGHT
        ctx.font = '12px sans-serif'
        const text = label.length > 7 ? `${label.slice(0, 7)}…` : label
        const tx = Math.min(Math.max(xs[i] - 30, 8), cssW - 76)
        const ty = node.weight === 'bypass' ? y + 26 : y + 22
        ctx.fillText(text, tx, ty)
        if (node.mood) {
          // 情绪痕迹：小圆点
          ctx.fillStyle = RED
          ctx.beginPath()
          ctx.arc(tx + ctx.measureText(text).width + 6, ty - 4, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      })
    })

    hitsRef.current = hits
  }

  function drawNode(ctx: CanvasRenderingContext2D, x: number, y: number, node: NodeItem, hibernate: boolean, hits: HitCircle[]) {
    const done = node.status === 'done'
    const supply = node.kind === 'supply'
    const crossing = node.is_crossing
    let r = 7
    if (node.weight === 'main') r = 9
    else if (node.weight === 'side') r = 6.5
    else r = 5
    if (supply) r = 8

    ctx.save()
    ctx.strokeStyle = hibernate ? INK_LIGHT : INK
    ctx.fillStyle = done && !hibernate ? INK : '#FDFBF7'

    if (supply) {
      // 菱形补给站
      ctx.lineWidth = 2.4
      ctx.beginPath()
      ctx.moveTo(x, y - r)
      ctx.lineTo(x + r, y)
      ctx.lineTo(x, y + r)
      ctx.lineTo(x - r, y)
      ctx.closePath()
      if (done && !hibernate) ctx.fill()
      ctx.stroke()
    } else if (crossing) {
      // 粗描边圆环（岔路口）
      ctx.lineWidth = 3.5
      ctx.beginPath()
      ctx.arc(x, y, r + 2, 0, Math.PI * 2)
      ctx.stroke()
      if (done && !hibernate) {
        ctx.fillStyle = INK
        ctx.beginPath()
        ctx.arc(x, y, r - 2, 0, Math.PI * 2)
        ctx.fill()
      }
      hits.push({ x, y, r: r + 12, id: node.id })
      ctx.restore()
      return
    } else {
      // 常规节点；旁路用虚线描边
      ctx.lineWidth = node.weight === 'main' ? 3 : node.weight === 'side' ? 2 : 1.5
      if (node.weight === 'bypass') ctx.setLineDash([2.5, 2.5])
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      if (done && !hibernate) ctx.fill()
      ctx.stroke()
    }
    hits.push({ x, y, r: r + 11, id: node.id })
    ctx.restore()
  }

  function handleTap(e: any) {
    const touch = e.changedTouches?.[0] ?? e.touches?.[0]
    if (!touch) return
    let px = touch.x
    let py = touch.y
    if (px == null || py == null) {
      // H5: 用 client 坐标减画布偏移
      const query = Taro.createSelectorQuery()
      query.select(`#${canvasId.current}`).boundingClientRect((rect: any) => {
        if (rect) tryHit(touch.clientX - rect.left, touch.clientY - rect.top)
      }).exec()
      return
    }
    tryHit(px, py)
  }

  function tryHit(x: number, y: number) {
    for (const h of hitsRef.current) {
      const dx = x - h.x
      const dy = y - h.y
      if (dx * dx + dy * dy <= h.r * h.r) {
        onNodeClick(h.id)
        return
      }
    }
  }

  const subjects = detail.branches.filter((b) => b.type === 'subject')
  const height = Math.max(TOP + subjects.length * LINE_GAP, 360)

  return (
    <div className="w-full px-4 pb-4">
      <canvas
        id={canvasId.current}
        style={{ width: '100%', height: `${height}px` }}
        className="rounded-sketch bg-card border-2 border-border/30 shadow-sketch-sm"
        onTouchEnd={handleTap as any}
        {...({ type: '2d' } as any)}
      />
    </div>
  )
}
