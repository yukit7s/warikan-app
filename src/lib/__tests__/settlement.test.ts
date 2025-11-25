import { calculateSettlement, SettlementResult } from '../settlement'
import { Payment } from '../../types/payment'
import { Member } from '../../types/group'

describe('calculateSettlement', () => {
  const members: Member[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'charlie', name: 'Charlie' }
  ]

  it('should calculate equal split for single payment', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 3000,
        description: 'ディナー',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 1000 },
          { memberId: 'bob', share: 1000 },
          { memberId: 'charlie', share: 1000 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    expect(result).toEqual({
      balances: {
        alice: 2000,  // 3000 - 1000
        bob: -1000,   // 0 - 1000
        charlie: -1000 // 0 - 1000
      },
      transactions: [
        { from: 'bob', to: 'alice', amount: 1000 },
        { from: 'charlie', to: 'alice', amount: 1000 }
      ]
    })
  })

  it('should calculate settlement for multiple payments with different participants', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 2000,
        description: 'ランチ',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 1000 },
          { memberId: 'bob', share: 1000 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment2',
        groupId: 'group1',
        amount: 3000,
        description: 'カフェ',
        payerId: 'bob',
        participants: [
          { memberId: 'bob', share: 1500 },
          { memberId: 'charlie', share: 1500 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    expect(result.balances).toEqual({
      alice: 1000,   // 2000 - 1000
      bob: 500,      // 3000 - 1000 - 1500
      charlie: -1500 // 0 - 1500
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'alice', amount: 1000
    })
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'bob', amount: 500
    })
  })

  it('should handle case where no settlement is needed', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'テスト',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 1000 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    expect(result.balances).toEqual({
      alice: 0,
      bob: 0,
      charlie: 0
    })
    expect(result.transactions).toHaveLength(0)
  })
})