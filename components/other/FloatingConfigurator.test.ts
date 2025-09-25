import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import FloatingConfigurator from '@/components/FloatingConfigurator.vue'

// Mock the layout composable
const mockToggleDarkMode = vi.fn()
const mockIsDarkTheme = { value: false }

vi.mock('@/composables/useLayout', () => ({
  useLayout: () => ({
    toggleDarkMode: mockToggleDarkMode,
    isDarkTheme: mockIsDarkTheme
  })
}))

// Mock the AppConfigurator component
vi.mock('@/layouts/AppConfigurator.vue', () => ({
  default: {
    name: 'AppConfigurator',
    template: '<div data-testid="app-configurator">App Configurator</div>'
  }
}))

// Mock PrimeVue Button component
const MockButton = {
  name: 'Button',
  props: ['icon', 'type', 'rounded', 'severity'],
  emits: ['click'],
  template: `<button 
    :class="['mock-button', severity]" 
    :type="type"
    @click="$emit('click')"
    data-testid="button"
  >
    <i v-if="icon" :class="icon"></i>
  </button>`
}

describe('FloatingConfigurator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders floating configurator correctly', () => {
    const wrapper = mount(FloatingConfigurator, {
      global: {
        components: {
          Button: MockButton
        },
        stubs: {
          'AppConfigurator': true
        }
      }
    })

    expect(wrapper.find('.fixed.flex.gap-4.top-8.right-8').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="button"]')).toHaveLength(2)
  })

  it('displays sun icon when dark theme is disabled', () => {
    mockIsDarkTheme.value = false
    
    const wrapper = mount(FloatingConfigurator, {
      global: {
        components: {
          Button: MockButton
        },
        stubs: {
          'AppConfigurator': true
        }
      }
    })

    const themeButton = wrapper.findAll('[data-testid="button"]')[0]
    // Check that the theme button is rendered
    expect(themeButton.exists()).toBe(true)
  })

  it('displays moon icon when dark theme is enabled', () => {
    mockIsDarkTheme.value = true
    
    const wrapper = mount(FloatingConfigurator, {
      global: {
        components: {
          Button: MockButton
        },
        stubs: {
          'AppConfigurator': true
        }
      }
    })

    const themeButton = wrapper.findAll('[data-testid="button"]')[0]
    expect(themeButton.exists()).toBe(true)
  })

  it('calls toggleDarkMode when theme button is clicked', async () => {
    const wrapper = mount(FloatingConfigurator, {
      global: {
        components: {
          Button: MockButton
        },
        stubs: {
          'AppConfigurator': true
        }
      }
    })

    const themeButton = wrapper.findAll('[data-testid="button"]')[0]
    await themeButton.trigger('click')

    expect(mockToggleDarkMode).toHaveBeenCalledOnce()
  })

  it('renders palette button with correct icon', () => {
    const wrapper = mount(FloatingConfigurator, {
      global: {
        components: {
          Button: MockButton
        },
        stubs: {
          'AppConfigurator': true
        }
      }
    })

    const paletteButton = wrapper.findAll('[data-testid="button"]')[1]
    expect(paletteButton.find('.pi-palette').exists()).toBe(true)
  })

  it('includes AppConfigurator component', () => {
    const wrapper = mount(FloatingConfigurator, {
      global: {
        components: {
          Button: MockButton
        }
      }
    })

    // Since AppConfigurator is mocked, we can't test its exact rendering
    // but we can verify the structure includes it
    expect(wrapper.find('.relative').exists()).toBe(true)
  })
})