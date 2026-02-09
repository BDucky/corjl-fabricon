import { describe, it, expect } from 'vitest'

describe('Simple Math', () => {
  it('should add numbers correctly', () => {
    expect(1 + 1).toBe(2)
  })

  it('should multiply numbers correctly', () => {
    expect(2 * 3).toBe(6)
  })

  it('should concat strings correctly', () => {
    expect('hello' + ' world').toBe('hello world')
  })
})
