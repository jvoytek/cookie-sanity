import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UploadOrders from '@/components/UploadOrders.vue'

// Mock PrimeVue useToast
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: vi.fn()
  })
}))

// Mock useToast
const mockToast = {
  add: vi.fn()
}
global.useToast = vi.fn(() => mockToast)

describe('UploadOrders', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(UploadOrders, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'Card': true,
            'Button': true,
            'FileUpload': true,
            'Message': true,
            'DataTable': true,
            'Toolbar': true,
            'Dialog': true,
            'ProgressSpinner': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(UploadOrders, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'Card': true,
          'Button': true,
          'FileUpload': true,
          'Message': true,
          'DataTable': true,
          'Toolbar': true,
          'Dialog': true,
          'ProgressSpinner': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})