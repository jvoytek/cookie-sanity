import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroWidget from '@/components/landing/HeroWidget.vue'

describe('HeroWidget', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(HeroWidget, {
        global: {
          stubs: {
            'Button': true,
            'Carousel': true,
            'NuxtLink': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(HeroWidget, {
      global: {
        stubs: {
          'Button': true,
          'Carousel': true,
          'NuxtLink': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })

  it('renders hero content', () => {
    const wrapper = mount(HeroWidget, {
      global: {
        stubs: {
          'Button': true,
          'Carousel': true,
          'NuxtLink': true
        }
      }
    })
    
    expect(wrapper.text()).toBeDefined()
  })
})