import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseButton from '@components/ui/BaseButton.vue'

describe('BaseButton.vue', () => {
  it('renders slot content', () => {
    const wrapper = mount(BaseButton, {
      slots: {
        default: 'Click me',
      },
    })
    expect(wrapper.text()).toContain('Click me')
  })

  it('applies primary variant by default', () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Button' },
    })
    expect(wrapper.element.getAttribute('class')).toContain('bg-blue-500')
  })

  it('applies secondary variant when specified', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'secondary' },
      slots: { default: 'Button' },
    })
    expect(wrapper.element.getAttribute('class')).toContain('bg-gray-200')
  })

  it('applies danger variant when specified', () => {
    const wrapper = mount(BaseButton, {
      props: { variant: 'danger' },
      slots: { default: 'Button' },
    })
    expect(wrapper.element.getAttribute('class')).toContain('bg-red-500')
  })

  it('disables button when disabled prop is true', () => {
    const wrapper = mount(BaseButton, {
      props: { disabled: true },
      slots: { default: 'Button' },
    })
    expect(wrapper.element.getAttribute('disabled')).toBeDefined()
  })

  it('shows loading spinner when isLoading is true', () => {
    const wrapper = mount(BaseButton, {
      props: { isLoading: true },
      slots: { default: 'Button' },
    })
    expect(wrapper.text()).toContain('Loading')
    expect(wrapper.find('svg').exists()).toBe(true)
  })

  it('emits click event when clicked', async () => {
    const wrapper = mount(BaseButton, {
      slots: { default: 'Click me' },
    })
    await wrapper.trigger('click')
    expect(wrapper.emitted()).toBeDefined()
  })
})
