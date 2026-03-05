import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ShotMap } from '@/components/matches/ShotMap'
import type { Shot } from '@/types'

const shots: readonly Shot[] = [
  { x: 80, y: 30, outcome: 'goal', xG: 0.6, playerName: 'Player A', minute: 10 },
  { x: 75, y: 40, outcome: 'saved', xG: 0.4, playerName: 'Player B', minute: 20 },
  { x: 70, y: 50, outcome: 'missed', xG: 0.2, playerName: 'Player C', minute: 30 },
]

describe('ShotMap', () => {
  it('renders correct number of shot dots', () => {
    const { container } = render(<ShotMap shots={shots} />)
    expect(container.querySelectorAll('circle')).toHaveLength(3)
  })

  it('goal shots render with green fill', () => {
    const { container } = render(<ShotMap shots={shots} />)
    const circles = container.querySelectorAll('circle')
    expect(circles[0]).toHaveAttribute('fill', '#22c55e')
  })

  it('saved shots render with white fill', () => {
    const { container } = render(<ShotMap shots={shots} />)
    const circles = container.querySelectorAll('circle')
    expect(circles[1]).toHaveAttribute('fill', '#ffffff')
  })
})
