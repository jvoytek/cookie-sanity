import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FooterWidget from '@/components/landing/FooterWidget.vue'

describe('FooterWidget', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(FooterWidget, {
        global: {
          stubs: {
            'NuxtLink': true,
            'Button': true,
            'InputText': true,
            'Divider': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(FooterWidget, {
      global: {
        stubs: {
          'NuxtLink': true,
          'Button': true,
          'InputText': true,
          'Divider': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })

  it('renders footer content', () => {
    const wrapper = mount(FooterWidget, {
      global: {
        stubs: {
          'NuxtLink': true,
          'Button': true,
          'InputText': true,
          'Divider': true
        }
      }
    })
    
    expect(wrapper.text()).toBeDefined()
  })
})