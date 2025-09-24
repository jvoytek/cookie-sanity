import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue'

describe('RevenueStreamWidget', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(RevenueStreamWidget, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'Card': true,
            'Chart': true,
            'Button': true,
            'Dropdown': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(RevenueStreamWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'Card': true,
          'Chart': true,
          'Button': true,
          'Dropdown': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})