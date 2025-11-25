import { PaymentManager } from '../payment-manager'
import { Payment, Participant } from '../../types/payment'

describe('PaymentManager', () => {
  let paymentManager: PaymentManager
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
    paymentManager = new PaymentManager(mockStorage)
  })

  describe('createPayment', () => {
    it('should create a new payment', () => {
      const participants: Participant[] = [
        { memberId: 'alice', share: 1500 },
        { memberId: 'bob', share: 1500 }
      ]

      const payment = paymentManager.createPayment(
        'group1',
        3000,
        'ディナー',
        'alice',
        participants
      )

      expect(payment.groupId).toBe('group1')
      expect(payment.amount).toBe(3000)
      expect(payment.description).toBe('ディナー')
      expect(payment.payerId).toBe('alice')
      expect(payment.participants).toEqual(participants)
      expect(payment.id).toBeDefined()
      expect(payment.date).toBeInstanceOf(Date)
    })

    it('should save payment to storage', () => {
      const participants: Participant[] = [
        { memberId: 'alice', share: 1000 }
      ]

      paymentManager.createPayment('group1', 1000, 'テスト', 'alice', participants)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'warikan-payments',
        expect.any(String)
      )
    })
  })

  describe('getPaymentsByGroup', () => {
    it('should return payments for specific group', () => {
      const mockPayments = [
        {
          id: 'payment1',
          groupId: 'group1',
          amount: 1000,
          description: 'テスト1',
          payerId: 'alice',
          participants: [{ memberId: 'alice', share: 1000 }],
          date: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'payment2',
          groupId: 'group2',
          amount: 2000,
          description: 'テスト2',
          payerId: 'bob',
          participants: [{ memberId: 'bob', share: 2000 }],
          date: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockPayments))

      const payments = paymentManager.getPaymentsByGroup('group1')

      expect(payments).toHaveLength(1)
      expect(payments[0].groupId).toBe('group1')
    })

    it('should return empty array if no payments exist', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(null)

      const payments = paymentManager.getPaymentsByGroup('group1')

      expect(payments).toEqual([])
    })
  })

  describe('updatePayment', () => {
    it('should update existing payment', () => {
      const mockPayments = [
        {
          id: 'payment1',
          groupId: 'group1',
          amount: 1000,
          description: 'テスト',
          payerId: 'alice',
          participants: [{ memberId: 'alice', share: 1000 }],
          date: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockPayments))

      const updatedPayment = paymentManager.updatePayment('payment1', {
        description: '更新されたテスト',
        amount: 1500
      })

      expect(updatedPayment?.description).toBe('更新されたテスト')
      expect(updatedPayment?.amount).toBe(1500)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should return null if payment not found', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([]))

      const result = paymentManager.updatePayment('nonexistent', { description: 'test' })

      expect(result).toBeNull()
    })
  })

  describe('deletePayment', () => {
    it('should delete payment', () => {
      const mockPayments = [
        {
          id: 'payment1',
          groupId: 'group1',
          amount: 1000,
          description: 'テスト',
          payerId: 'alice',
          participants: [{ memberId: 'alice', share: 1000 }],
          date: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockPayments))

      const result = paymentManager.deletePayment('payment1')

      expect(result).toBe(true)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should return false if payment not found', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([]))

      const result = paymentManager.deletePayment('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('calculateEqualShares', () => {
    it('should calculate equal shares for participants', () => {
      const memberIds = ['alice', 'bob', 'charlie']
      const totalAmount = 3000

      const participants = paymentManager.calculateEqualShares(memberIds, totalAmount)

      expect(participants).toHaveLength(3)
      expect(participants[0]).toEqual({ memberId: 'alice', share: 1000 })
      expect(participants[1]).toEqual({ memberId: 'bob', share: 1000 })
      expect(participants[2]).toEqual({ memberId: 'charlie', share: 1000 })
    })

    it('should handle uneven division correctly', () => {
      const memberIds = ['alice', 'bob']
      const totalAmount = 1001

      const participants = paymentManager.calculateEqualShares(memberIds, totalAmount)

      expect(participants[0].share + participants[1].share).toBe(1001)
      expect(participants[0].share).toBe(501)
      expect(participants[1].share).toBe(500)
    })
  })

  describe('updatePayment', () => {
    it('should update payment successfully', () => {
      const mockPayment: Payment = {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'ランチ',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 500 },
          { memberId: 'bob', share: 500 }
        ],
        date: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockPayment]))

      const updatedPayment = paymentManager.updatePayment('payment1', {
        amount: 1500,
        description: 'ディナー',
        participants: [
          { memberId: 'alice', share: 750 },
          { memberId: 'bob', share: 750 }
        ]
      })

      expect(updatedPayment?.amount).toBe(1500)
      expect(updatedPayment?.description).toBe('ディナー')
      expect(updatedPayment?.participants).toHaveLength(2)
      expect(updatedPayment?.participants[0].share).toBe(750)
      expect(updatedPayment?.updatedAt).not.toEqual(mockPayment.updatedAt)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should return null for non-existent payment', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([]))

      const result = paymentManager.updatePayment('nonexistent', {
        amount: 2000
      })

      expect(result).toBeNull()
    })

    it('should update only amount when other fields are not provided', () => {
      const mockPayment: Payment = {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'ランチ',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 500 },
          { memberId: 'bob', share: 500 }
        ],
        date: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockPayment]))

      const updatedPayment = paymentManager.updatePayment('payment1', {
        amount: 2000
      })

      expect(updatedPayment?.amount).toBe(2000)
      expect(updatedPayment?.description).toBe('ランチ')
      expect(updatedPayment?.payerId).toBe('alice')
      expect(updatedPayment?.participants).toEqual(mockPayment.participants)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should update participants correctly when provided', () => {
      const mockPayment: Payment = {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'ランチ',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 500 },
          { memberId: 'bob', share: 500 }
        ],
        date: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockPayment]))

      const newParticipants = [
        { memberId: 'alice', share: 1000 }
      ]

      const updatedPayment = paymentManager.updatePayment('payment1', {
        participants: newParticipants
      })

      expect(updatedPayment?.participants).toHaveLength(1)
      expect(updatedPayment?.participants[0].memberId).toBe('alice')
      expect(updatedPayment?.participants[0].share).toBe(1000)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })
  })
})