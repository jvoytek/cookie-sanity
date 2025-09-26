import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import OrdersList from '@/components/inventory/OrdersList.vue'

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

describe('OrdersList', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(OrdersList, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'DataTable': true,
            'Button': true,
            'InputText': true,
            'Dropdown': true,
            'Toolbar': true,
            'Dialog': true,
            'TransactionDialog': true,
            'Badge': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(OrdersList, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'DataTable': true,
          'Button': true,
          'InputText': true,
          'Dropdown': true,
          'Toolbar': true,
          'Dialog': true,
          'TransactionDialog': true,
          'Badge': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})