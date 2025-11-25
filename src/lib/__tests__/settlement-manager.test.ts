import { SettlementManager } from '../settlement-manager'
import { Settlement } from '../../types/settlement'

describe('SettlementManager', () => {
  let settlementManager: SettlementManager
  let mockStorage: Storage

  beforeEach(() => {
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      length: 0,
      key: jest.fn()
    }
    settlementManager = new SettlementManager(mockStorage)
  })

  describe('createSettlement', () => {
    it('should create a new settlement record', () => {
      const settlement = settlementManager.createSettlement(
        'group1',
        'alice',
        'bob',
        1000
      )

      expect(settlement.groupId).toBe('group1')
      expect(settlement.fromMemberId).toBe('alice')
      expect(settlement.toMemberId).toBe('bob')
      expect(settlement.amount).toBe(1000)
      expect(settlement.isCompleted).toBe(false)
      expect(settlement.id).toBeDefined()
      expect(settlement.createdAt).toBeInstanceOf(Date)
    })

    it('should save settlement to storage', () => {
      settlementManager.createSettlement('group1', 'alice', 'bob', 1000)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'warikan-settlements',
        expect.any(String)
      )
    })
  })

  describe('markSettlementCompleted', () => {
    it('should mark settlement as completed', () => {
      const mockSettlements = [
        {
          id: 'settlement1',
          groupId: 'group1',
          fromMemberId: 'alice',
          toMemberId: 'bob',
          amount: 1000,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockSettlements))

      const result = settlementManager.markSettlementCompleted('settlement1')

      expect(result?.isCompleted).toBe(true)
      expect(result?.completedAt).toBeInstanceOf(Date)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should return null if settlement not found', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([]))

      const result = settlementManager.markSettlementCompleted('nonexistent')

      expect(result).toBeNull()
    })
  })

  describe('getSettlementsByGroup', () => {
    it('should return settlements for specific group', () => {
      const mockSettlements = [
        {
          id: 'settlement1',
          groupId: 'group1',
          fromMemberId: 'alice',
          toMemberId: 'bob',
          amount: 1000,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'settlement2',
          groupId: 'group2',
          fromMemberId: 'charlie',
          toMemberId: 'dave',
          amount: 500,
          isCompleted: true,
          completedAt: '2024-01-02T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockSettlements))

      const settlements = settlementManager.getSettlementsByGroup('group1')

      expect(settlements).toHaveLength(1)
      expect(settlements[0].groupId).toBe('group1')
    })
  })

  describe('deleteSettlement', () => {
    it('should delete settlement', () => {
      const mockSettlements = [
        {
          id: 'settlement1',
          groupId: 'group1',
          fromMemberId: 'alice',
          toMemberId: 'bob',
          amount: 1000,
          isCompleted: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockSettlements))

      const result = settlementManager.deleteSettlement('settlement1')

      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })
  })
})