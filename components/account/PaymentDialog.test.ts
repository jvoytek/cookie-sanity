import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PaymentDialog from '@/components/account/PaymentDialog.vue'

describe('PaymentDialog', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(PaymentDialog, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'Dialog': true,
            'FormKit': true,
            'Button': true,
            'InputText': true,
            'InputNumber': true,
            'Dropdown': true,
            'Calendar': true,
            'Textarea': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(PaymentDialog, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'Dialog': true,
          'FormKit': true,
          'Button': true,
          'InputText': true,
          'InputNumber': true,
          'Dropdown': true,
          'Calendar': true,
          'Textarea': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})