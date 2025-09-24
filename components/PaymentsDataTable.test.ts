import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import PaymentsDataTable from '@/components/PaymentsDataTable.vue'

describe('PaymentsDataTable', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(PaymentsDataTable, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'DataTable': true,
            'Column': true,
            'Button': true,
            'InputText': true,
            'Toolbar': true,
            'ConfirmDialog': true,
            'PaymentDialog': true,
            'Badge': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(PaymentsDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'DataTable': true,
          'Column': true,
          'Button': true,
          'InputText': true,
          'Toolbar': true,
          'ConfirmDialog': true,
          'PaymentDialog': true,
          'Badge': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})