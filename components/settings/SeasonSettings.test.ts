import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import SeasonSettings from '@/components/SeasonSettings.vue'

describe('SeasonSettings', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(SeasonSettings, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'DataTable': true,
            'Button': true,
            'InputText': true,
            'InputNumber': true,
            'Dropdown': true,
            'Toolbar': true,
            'Dialog': true,
            'Calendar': true,
            'Checkbox': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(SeasonSettings, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'DataTable': true,
          'Button': true,
          'InputText': true,
          'InputNumber': true,
          'Dropdown': true,
          'Toolbar': true,
          'Dialog': true,
          'Calendar': true,
          'Checkbox': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})