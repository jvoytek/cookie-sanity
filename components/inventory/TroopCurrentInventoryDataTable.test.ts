import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import TroopCurrentInventoryDataTable from '@/components/TroopCurrentInventoryDataTable.vue'

describe('TroopCurrentInventoryDataTable', () => {
  it('renders without crashing', () => {
    expect(() => {
      mount(TroopCurrentInventoryDataTable, {
        global: {
          plugins: [createTestingPinia()],
          stubs: {
            'DataTable': true,
            'Column': true,
            'Button': true,
            'InputNumber': true,
            'Toolbar': true,
            'ColumnGroup': true,
            'Row': true
          }
        }
      })
    }).not.toThrow()
  })

  it('mounts successfully', () => {
    const wrapper = mount(TroopCurrentInventoryDataTable, {
      global: {
        plugins: [createTestingPinia()],
        stubs: {
          'DataTable': true,
          'Column': true,
          'Button': true,
          'InputNumber': true,
          'Toolbar': true,
          'ColumnGroup': true,
          'Row': true
        }
      }
    })
    
    expect(wrapper.exists()).toBe(true)
  })
})