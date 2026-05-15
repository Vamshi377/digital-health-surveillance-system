import React from 'react'
import { cn } from '../../lib/utils'

export default function HealthOrbit3D({ compact = false, className }) {
  const pairs = Array.from({ length: compact ? 7 : 11 })

  return (
    <div className={cn('dna-visual-3d', compact && 'dna-visual-3d--compact', className)} aria-hidden="true">
      <div className="dna-visual-3d__scene">
        {pairs.map((_, index) => (
          <div
            key={index}
            className="dna-visual-3d__pair"
            style={{
              '--i': index,
              '--total': pairs.length,
              '--delay': `${index * -0.18}s`,
            }}
          >
            <span className="dna-visual-3d__node dna-visual-3d__node--left" />
            <span className="dna-visual-3d__bar" />
            <span className="dna-visual-3d__node dna-visual-3d__node--right" />
          </div>
        ))}
        <div className="dna-visual-3d__glow" />
      </div>
    </div>
  )
}
