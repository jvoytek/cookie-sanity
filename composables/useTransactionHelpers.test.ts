import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTransactionHelpers } from '@/composables/useTransactionHelpers'
import type { Order } from '@/types/types'

// Mock the stores and dependencies
const mockOrdersStore = {
  activeTransaction: {} as Order,
  transactionDialogFormSchema: { value: [] },
  editTransactionDialogVisible: false,
  deleteTransactionDialogVisible: false,
  transactionTypeOptions: [
    { label: 'Council to Troop', value: 'C2T' },
    { label: 'Troop to Troop', value: 'T2T' },
    { label: 'Troop to Girl', value: 'T2G' },
    { label: 'Girl to Troop', value: 'G2T' },
    { label: 'Girl to Girl', value: 'G2G' }
  ],
  upsertOrder: vi.fn(),
  insertNewOrderFromOrdersList: vi.fn(),
  deleteOrder: vi.fn()
}

const mockCookiesStore = {
  allCookies: [
    { name: 'Thin Mints', abbreviation: 'TM', id: 1 },
    { name: 'Adventurefuls', abbreviation: 'ADV', id: 2 }
  ]
}

const mockGirlsStore = {
  girlOptions: [
    { label: 'Alice', value: 1 },
    { label: 'Bob', value: 2 }
  ]
}

const mockToast = {
  add: vi.fn()
}

// Mock the global functions
vi.mocked(useOrdersStore).mockReturnValue(mockOrdersStore)
vi.mocked(useCookiesStore).mockReturnValue(mockCookiesStore)
vi.mocked(useGirlsStore).mockReturnValue(mockGirlsStore)
vi.mocked(useToast).mockReturnValue(mockToast)

describe('useTransactionHelpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    mockOrdersStore.activeTransaction = {}
    mockOrdersStore.editTransactionDialogVisible = false
    mockOrdersStore.deleteTransactionDialogVisible = false
  })

  describe('transactionTypeBadgeSeverity', () => {
    it('returns correct severity for each transaction type', () => {
      const { transactionTypeBadgeSeverity } = useTransactionHelpers()

      expect(transactionTypeBadgeSeverity('C2T')).toBe('success')
      expect(transactionTypeBadgeSeverity('T2T')).toBe('success')
      expect(transactionTypeBadgeSeverity('T2G')).toBe('success')
      expect(transactionTypeBadgeSeverity('G2T')).toBe('warn')
      expect(transactionTypeBadgeSeverity('G2G')).toBe('info')
      expect(transactionTypeBadgeSeverity('UNKNOWN')).toBe(null)
      expect(transactionTypeBadgeSeverity('')).toBe(null)
    })
  })

  describe('editTransaction', () => {
    it('sets up the edit transaction dialog correctly', () => {
      const { editTransaction } = useTransactionHelpers()
      const testOrder: Order = {
        id: 1,
        order_date: '2024-01-15',
        order_num: 'TEST123',
        type: 'order',
        status: 'pending',
        profile: 'test-profile',
        season: 1,
        cookies: { TM: 5, ADV: 3 },
        to: null,
        from: null,
        supplier: null,
        notes: null,
        processed_date: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      editTransaction(testOrder, 'troop')

      expect(mockOrdersStore.activeTransaction).toEqual(testOrder)
      expect(mockOrdersStore.transactionDialogFormSchema.value).toBeDefined()
      expect(mockOrdersStore.editTransactionDialogVisible).toBe(true)
    })

    it('uses default type when not specified', () => {
      const { editTransaction } = useTransactionHelpers()
      const testOrder = { id: 1 } as Order

      editTransaction(testOrder)

      expect(mockOrdersStore.transactionDialogFormSchema.value).toBeDefined()
    })
  })

  describe('hideDialog', () => {
    it('hides the transaction dialog and resets submitted state', () => {
      const { hideDialog, submitted } = useTransactionHelpers()
      
      mockOrdersStore.editTransactionDialogVisible = true
      submitted.value = true

      hideDialog()

      expect(mockOrdersStore.editTransactionDialogVisible).toBe(false)
      expect(submitted.value).toBe(false)
    })
  })

  describe('saveTransaction', () => {
    it('calls upsertOrder when transaction has an id', async () => {
      const { saveTransaction, submitted } = useTransactionHelpers()
      
      const testTransaction = { id: 1, order_num: 'TEST123' } as Order
      mockOrdersStore.activeTransaction = testTransaction
      mockOrdersStore.editTransactionDialogVisible = true
      submitted.value = true

      await saveTransaction()

      expect(mockOrdersStore.upsertOrder).toHaveBeenCalledWith(testTransaction)
      expect(mockOrdersStore.insertNewOrderFromOrdersList).not.toHaveBeenCalled()
      expect(mockOrdersStore.editTransactionDialogVisible).toBe(false)
      expect(mockOrdersStore.activeTransaction).toEqual({})
      expect(submitted.value).toBe(false)
    })

    it('calls insertNewOrderFromOrdersList when transaction has no id', async () => {
      const { saveTransaction, submitted } = useTransactionHelpers()
      
      const testTransaction = { order_num: 'NEW123' } as Order
      mockOrdersStore.activeTransaction = testTransaction
      mockOrdersStore.editTransactionDialogVisible = true
      submitted.value = true

      await saveTransaction()

      expect(mockOrdersStore.insertNewOrderFromOrdersList).toHaveBeenCalledWith(testTransaction)
      expect(mockOrdersStore.upsertOrder).not.toHaveBeenCalled()
      expect(mockOrdersStore.editTransactionDialogVisible).toBe(false)
      expect(mockOrdersStore.activeTransaction).toEqual({})
      expect(submitted.value).toBe(false)
    })
  })

  describe('confirmDeleteTransaction', () => {
    it('sets up delete confirmation dialog correctly', () => {
      const { confirmDeleteTransaction } = useTransactionHelpers()
      const testOrder: Order = {
        id: 1,
        order_date: '2024-01-15',
        order_num: 'TEST123',
        type: 'order',
        status: 'pending',
        profile: 'test-profile',
        season: 1,
        cookies: { TM: 5, ADV: 3 },
        to: null,
        from: null,
        supplier: null,
        notes: null,
        processed_date: null,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      confirmDeleteTransaction(testOrder)

      expect(mockOrdersStore.activeTransaction).toEqual(testOrder)
      expect(mockOrdersStore.deleteTransactionDialogVisible).toBe(true)
    })
  })

  describe('deleteTransaction', () => {
    it('successfully deletes transaction', async () => {
      const { deleteTransaction } = useTransactionHelpers()
      
      const testOrder = { id: 1 } as Order
      mockOrdersStore.activeTransaction = testOrder
      mockOrdersStore.deleteTransactionDialogVisible = true

      await deleteTransaction()

      expect(mockOrdersStore.deleteOrder).toHaveBeenCalledWith(1)
      expect(mockOrdersStore.deleteTransactionDialogVisible).toBe(false)
      expect(mockOrdersStore.activeTransaction).toEqual({})
    })

    it('handles deletion error gracefully', async () => {
      const { deleteTransaction } = useTransactionHelpers()
      
      const testError = new Error('Delete failed')
      mockOrdersStore.deleteOrder.mockImplementation(() => {
        throw testError
      })
      
      const testOrder = { id: 1 } as Order
      mockOrdersStore.activeTransaction = testOrder

      await deleteTransaction()

      expect(mockToast.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'Error',
        detail: 'Delete failed',
        life: 3000
      })
    })
  })

  describe('form and submitted refs', () => {
    it('returns form and submitted refs correctly', () => {
      const { form, submitted } = useTransactionHelpers()
      
      expect(form.value).toBe(null)
      expect(submitted.value).toBe(false)
      
      // Test that they're reactive
      submitted.value = true
      expect(submitted.value).toBe(true)
    })
  })

  describe('composable structure', () => {
    it('returns all expected methods and properties', () => {
      const helpers = useTransactionHelpers()
      
      expect(helpers).toHaveProperty('form')
      expect(helpers).toHaveProperty('submitted')
      expect(helpers).toHaveProperty('editTransaction')
      expect(helpers).toHaveProperty('hideDialog')
      expect(helpers).toHaveProperty('saveTransaction')
      expect(helpers).toHaveProperty('confirmDeleteTransaction')
      expect(helpers).toHaveProperty('deleteTransaction')
      expect(helpers).toHaveProperty('transactionTypeBadgeSeverity')

      expect(typeof helpers.editTransaction).toBe('function')
      expect(typeof helpers.hideDialog).toBe('function')
      expect(typeof helpers.saveTransaction).toBe('function')
      expect(typeof helpers.confirmDeleteTransaction).toBe('function')
      expect(typeof helpers.deleteTransaction).toBe('function')
      expect(typeof helpers.transactionTypeBadgeSeverity).toBe('function')
    })
  })
})