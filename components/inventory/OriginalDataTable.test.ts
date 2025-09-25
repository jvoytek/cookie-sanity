import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import OriginalDataTable from '@/components/OriginalDataTable.vue'

describe('OriginalDataTable', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(OriginalDataTable, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'DataTable': true,
            'Column': true,
            'Button': true,
            'InputText': true,
            'Toolbar': true,
            'MultiSelect': true,
            'ColumnGroup': true,
            'Row': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(OriginalDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'DataTable': true,
          'Column': true,
          'Button': true,
          'InputText': true,
          'Toolbar': true,
          'MultiSelect': true,
          'ColumnGroup': true,
          'Row': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})