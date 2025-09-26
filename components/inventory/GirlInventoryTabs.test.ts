import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import GirlInventoryTabs from '@/components/inventory/GirlInventoryTabs.vue'

describe('GirlInventoryTabs', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(GirlInventoryTabs, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'TabView': true,
            'TabPanel': true,
            'DataTable': true,
            'Column': true,
            'Button': true,
            'InputNumber': true,
            'Toolbar': true,
            'CookieList': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(GirlInventoryTabs, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'TabView': true,
          'TabPanel': true,
          'DataTable': true,
          'Column': true,
          'Button': true,
          'InputNumber': true,
          'Toolbar': true,
          'CookieList': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})