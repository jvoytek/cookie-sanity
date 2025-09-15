import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// Create a simple test component to verify Vue testing works
const SimpleComponent = {
  template: '<div class="test-component">{{ message }}</div>',
  data() {
    return {
      message: 'Hello from Vue component'
    }
  }
}

describe('Vue Component Testing', () => {
  it('can mount and test a simple Vue component', () => {
    const wrapper = mount(SimpleComponent)
    
    expect(wrapper.text()).toContain('Hello from Vue component')
    expect(wrapper.find('.test-component').exists()).toBe(true)
  })

  it('can test component props and data', () => {
    const ComponentWithProps = {
      template: '<div>{{ title }}: {{ count }}</div>',
      props: ['title'],
      data() {
        return {
          count: 42
        }
      }
    }

    const wrapper = mount(ComponentWithProps, {
      props: {
        title: 'Counter'
      }
    })

    expect(wrapper.text()).toBe('Counter: 42')
  })
})