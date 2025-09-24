import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmationPage from '@/components/ConfirmationPage.vue'

describe('ConfirmationPage', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(ConfirmationPage, {
        global: {
          stubs: {
            'Message': true,
            'Card': true,
            'Button': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(ConfirmationPage, {
      global: {
        stubs: {
          'Message': true,
          'Card': true,
          'Button': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})