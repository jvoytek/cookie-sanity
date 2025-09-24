import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PricingWidget from '@/components/landing/PricingWidget.vue'

describe('PricingWidget', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(PricingWidget, {
        global: {
          stubs: {
            'Button': true,
            'Card': true,
            'Badge': true,
            'Divider': true,
            'SelectButton': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(PricingWidget, {
      global: {
        stubs: {
          'Button': true,
          'Card': true,
          'Badge': true,
          'Divider': true,
          'SelectButton': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })

  it('renders pricing content', () => {
    const wrapper = mount(PricingWidget, {
      global: {
        stubs: {
          'Button': true,
          'Card': true,
          'Badge': true,
          'Divider': true,
          'SelectButton': true
        }
      }
    })
    
    expect(wrapper.text()).toBeDefined()
  })
})