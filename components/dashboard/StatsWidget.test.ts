import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatsWidget from '@/components/dashboard/StatsWidget.vue'

describe('StatsWidget', () => {
  it('renders all four stat cards', () => {
    const wrapper = mount(StatsWidget)

    // Check that all 4 cards are rendered
    const cards = wrapper.findAll('.card')
    expect(cards).toHaveLength(4)
  })

  it('renders orders card correctly', () => {
    const wrapper = mount(StatsWidget)

    const orderCard = wrapper.findAll('.card')[0]
    expect(orderCard.text()).toContain('Orders')
    expect(orderCard.text()).toContain('152')
    expect(orderCard.text()).toContain('24 new')
    expect(orderCard.text()).toContain('since last visit')
    expect(orderCard.find('.pi-shopping-cart').exists()).toBe(true)
  })

  it('renders revenue card correctly', () => {
    const wrapper = mount(StatsWidget)

    const revenueCard = wrapper.findAll('.card')[1]
    expect(revenueCard.text()).toContain('Revenue')
    expect(revenueCard.text()).toContain('$2.100')
    expect(revenueCard.text()).toContain('%52+')
    expect(revenueCard.text()).toContain('since last week')
    expect(revenueCard.find('.pi-dollar').exists()).toBe(true)
  })

  it('renders customers card correctly', () => {
    const wrapper = mount(StatsWidget)

    const customersCard = wrapper.findAll('.card')[2]
    expect(customersCard.text()).toContain('Customers')
    expect(customersCard.text()).toContain('28441')
    expect(customersCard.text()).toContain('520')
    expect(customersCard.text()).toContain('newly registered')
    expect(customersCard.find('.pi-users').exists()).toBe(true)
  })

  it('renders comments card correctly', () => {
    const wrapper = mount(StatsWidget)

    const commentsCard = wrapper.findAll('.card')[3]
    expect(commentsCard.text()).toContain('Comments')
    expect(commentsCard.text()).toContain('152 Unread')
    expect(commentsCard.text()).toContain('85')
    expect(commentsCard.text()).toContain('responded')
    expect(commentsCard.find('.pi-comment').exists()).toBe(true)
  })

  it('has correct grid layout classes', () => {
    const wrapper = mount(StatsWidget)

    // Each card should have the correct grid classes
    const cardContainers = wrapper.findAll('.col-span-12')
    expect(cardContainers).toHaveLength(4)

    cardContainers.forEach(container => {
      expect(container.classes()).toContain('lg:col-span-6')
      expect(container.classes()).toContain('xl:col-span-3')
    })
  })

  it('displays correct icon colors', () => {
    const wrapper = mount(StatsWidget)

    // Check icon colors for each card
    const orderIcon = wrapper.find('.pi-shopping-cart')
    expect(orderIcon.classes()).toContain('text-blue-500')

    const revenueIcon = wrapper.find('.pi-dollar')
    expect(revenueIcon.classes()).toContain('text-orange-500')

    const customersIcon = wrapper.find('.pi-users')
    expect(customersIcon.classes()).toContain('text-cyan-500')

    const commentsIcon = wrapper.find('.pi-comment')
    expect(commentsIcon.classes()).toContain('text-purple-500')
  })

  it('has correct icon background colors', () => {
    const wrapper = mount(StatsWidget)
    
    const iconContainers = wrapper.findAll('.flex.items-center.justify-center')
    
    expect(iconContainers[0].classes()).toContain('bg-blue-100')
    expect(iconContainers[0].classes()).toContain('dark:bg-blue-400/10')
    
    expect(iconContainers[1].classes()).toContain('bg-orange-100')
    expect(iconContainers[1].classes()).toContain('dark:bg-orange-400/10')
    
    expect(iconContainers[2].classes()).toContain('bg-cyan-100')
    expect(iconContainers[2].classes()).toContain('dark:bg-cyan-400/10')
    
    expect(iconContainers[3].classes()).toContain('bg-purple-100')
    expect(iconContainers[3].classes()).toContain('dark:bg-purple-400/10')
  })

  it('has consistent card structure', () => {
    const wrapper = mount(StatsWidget)

    const cards = wrapper.findAll('.card')
    cards.forEach(card => {
      // Each card should have the flex layout
      expect(card.find('.flex.justify-between.mb-4').exists()).toBe(true)
      
      // Each card should have text elements with correct classes
      expect(card.find('.text-muted-color.font-medium.mb-4').exists()).toBe(true)
      expect(card.find('.text-surface-900.dark\\:text-surface-0.font-medium.text-xl').exists()).toBe(true)
      expect(card.find('.text-primary.font-medium').exists()).toBe(true)
      expect(card.find('.text-muted-color').exists()).toBe(true)
    })
  })

  it('renders without any props', () => {
    // This component doesn't take props, so it should render with static data
    expect(() => mount(StatsWidget)).not.toThrow()
  })

  it('contains proper semantic structure', () => {
    const wrapper = mount(StatsWidget)

    // Check that stat values are prominently displayed
    const statValues = wrapper.findAll('.text-surface-900.dark\\:text-surface-0.font-medium.text-xl')
    expect(statValues).toHaveLength(4)
    
    // Check that all stats have proper labels
    const statLabels = wrapper.findAll('.text-muted-color.font-medium.mb-4')
    expect(statLabels).toHaveLength(4)
  })
})