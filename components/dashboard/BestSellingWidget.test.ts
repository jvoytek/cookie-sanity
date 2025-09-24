import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue'

describe('BestSellingWidget', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(BestSellingWidget, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'Card': true,
            'Button': true,
            'DataTable': true,
            'Rating': true,
            'Avatar': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(BestSellingWidget, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'Card': true,
          'Button': true,
          'DataTable': true,
          'Rating': true,
          'Avatar': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})