/* Relationship orbit: closer to the centre = named more recently in Sirion's summaries; line weight = how often. */
import { cn } from '@/lib/utils'
import { fmtDY, initials } from '../activity/shared'
import { RINGS, type OrbitPerson } from './model'

const W = 760, H = 770, CX = 380, CY = 385, R = [118, 218, 312]

export function Orbit({ people, onOpen }: { people: OrbitPerson[]; onOpen: (key: string) => void }) {
  // one angle slot per person, taken in turns across the rings so neighbours never share an angle; the top stays clear for ring labels
  const byRing = [0, 1, 2].map(ri => people.filter(p => p.ring === ri).sort((a, b) => a.state.localeCompare(b.state) || b.mentions - a.mentions))
  const order: OrbitPerson[] = []
  while (byRing.some(r => r.length)) [2, 1, 0].forEach(ri => { const p = byRing[ri].shift(); if (p) order.push(p) })
  const pos = new Map<string, [number, number]>()
  order.forEach((p, i) => { const a = (-62 + (304 * (i + 0.5)) / order.length) * Math.PI / 180; pos.set(p.key, [CX + R[p.ring] * Math.cos(a), CY + R[p.ring] * Math.sin(a)]) })

  return (
    <div className="grid gap-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full min-w-[520px] max-w-[680px]" role="group" aria-label="Relationship orbit for TransAmerica key people">
          {R.map((r, i) => (
            <g key={r}>
              <circle cx={CX} cy={CY} r={r} fill="none" className="stroke-border" strokeDasharray={i === 2 ? '2 5' : undefined} />
              <text x={CX} y={CY - r - 8} textAnchor="middle" className="fill-muted-foreground text-[11px] font-medium tracking-wider uppercase">{RINGS[i][0]}</text>
            </g>
          ))}
          {order.map(p => {
            const [x, y] = pos.get(p.key)!, d = Math.hypot(x - CX, y - CY), ux = (x - CX) / d, uy = (y - CY) / d
            return <line key={'l' + p.key} x1={CX + ux * 48} y1={CY + uy * 48} x2={x - ux * 26} y2={y - uy * 26}
              strokeWidth={1.2 + Math.min(p.mentions, 8) * 0.3} strokeDasharray={p.state === 'active' ? undefined : p.state === 'ai' ? '4 4' : '3 4'}
              className={cn(p.state === 'active' ? 'stroke-foreground/40' : p.state === 'ai' ? 'stroke-foreground/40' : 'stroke-muted-foreground/50')} />
          })}
          <circle cx={CX} cy={CY} r={46} className="fill-surface-2 stroke-border" strokeWidth={1.5} />
          <text x={CX} y={CY + 2} textAnchor="middle" className="fill-foreground text-base font-medium">Sirion</text>
          <text x={CX} y={CY + 18} textAnchor="middle" className="fill-muted-foreground text-[11px]">Account team</text>
          {order.map(p => {
            const [x, y] = pos.get(p.key)!
            const when = p.last ? `last named ${fmtDY(p.last)}` : p.key.startsWith('news:') ? 'from public news, never named in a summary' : 'never named in a summary'
            return (
              <g key={p.key} tabIndex={0} role="button" aria-label={`${p.name}, ${p.role}, ${when}`} className="group cursor-pointer outline-none"
                onClick={() => onOpen(p.key)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(p.key) } }}>
                <title>{`${p.name} · ${p.role} · ${when}`}</title>
                <circle cx={x} cy={y} r={24} strokeWidth={2} strokeDasharray={p.state === 'active' ? undefined : p.state === 'ai' ? '1.5 3.5' : '5 4'}
                  className={cn('fill-card transition-[stroke-width] group-hover:stroke-[3.2] group-focus-visible:stroke-[4]',
                    p.state === 'active' ? 'stroke-foreground' : p.state === 'ai' ? 'stroke-foreground' : 'stroke-muted-foreground')} />
                <text x={x} y={y + 4} textAnchor="middle" className="fill-foreground text-xs font-medium">{initials(p.name)}</text>
                <text x={x} y={y + 40} textAnchor="middle" className="fill-foreground text-xs font-medium group-hover:underline">{p.name}</text>
                <text x={x} y={y + 53} textAnchor="middle" className="fill-muted-foreground text-[11px]">{p.role}</text>
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-full border-2 border-foreground" />Active contact</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-full border-2 border-dashed border-muted-foreground" />Quiet or no contact</span>
        <span className="inline-flex items-center gap-1.5"><i className="size-3 rounded-full border-2 border-dotted border-foreground" />Inferred, not confirmed</span>
      </div>
    </div>
  )
}
