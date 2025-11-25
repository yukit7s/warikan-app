import { calculateTotalSettlement } from '../total-settlement'
import { Member } from '../../types/group'
import { Payment } from '../../types/payment'

describe('calculateTotalSettlement', () => {
  const members: Member[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'charlie', name: 'Charlie' }
  ]

  it('should calculate total settlement for multiple payments with different payers', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'ランチ',
        payerId: 'alice',
        participants: [], // 総額割り勘では使用しない
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment2',
        groupId: 'group1',
        amount: 2000,
        description: 'ディナー',
        payerId: 'bob',
        participants: [], // 総額割り勘では使用しない
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateTotalSettlement(members, payments)

    // 総額3000円を3人で割る
    expect(result.totalAmount).toBe(3000)
    expect(result.perPersonShare).toBe(1000) // 3000 / 3 = 1000
    expect(result.remainder).toBe(0) // 3000 % 3 = 0

    // Alice: 支払い1000円、負担1000円 → 残高0円
    // Bob: 支払い2000円、負担1000円 → 残高+1000円
    // Charlie: 支払い0円、負担1000円 → 残高-1000円
    expect(result.balances).toEqual({
      alice: 0,
      bob: 1000,
      charlie: -1000
    })

    expect(result.transactions).toEqual([
      { from: 'charlie', to: 'bob', amount: 1000 }
    ])
  })

  it('should handle remainder correctly in total settlement', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'テスト',
        payerId: 'alice',
        participants: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateTotalSettlement(members, payments)

    // 1000円を3人で割る: 333円, 333円, 334円
    expect(result.totalAmount).toBe(1000)
    expect(result.perPersonShare).toBe(333) // 1000 / 3 = 333
    expect(result.remainder).toBe(1) // 1000 % 3 = 1

    // Alice: 支払い1000円、負担334円（あまり1円追加） → 残高+666円
    // Bob: 支払い0円、負担333円 → 残高-333円  
    // Charlie: 支払い0円、負担333円 → 残高-333円
    expect(result.balances).toEqual({
      alice: 666, // 1000 - 334
      bob: -333,  // 0 - 333
      charlie: -333 // 0 - 333
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.transactions).toContainEqual({
      from: 'bob', to: 'alice', amount: 333
    })
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'alice', amount: 333
    })
  })

  it('should handle case where everyone pays equally', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'Alice支払い',
        payerId: 'alice',
        participants: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment2',
        groupId: 'group1',
        amount: 1000,
        description: 'Bob支払い',
        payerId: 'bob',
        participants: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment3',
        groupId: 'group1',
        amount: 1000,
        description: 'Charlie支払い',
        payerId: 'charlie',
        participants: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateTotalSettlement(members, payments)

    // 各自1000円ずつ支払い、総額3000円を均等割り
    expect(result.totalAmount).toBe(3000)
    expect(result.perPersonShare).toBe(1000)
    expect(result.remainder).toBe(0)

    // 全員支払額=負担額なので残高は0
    expect(result.balances).toEqual({
      alice: 0,
      bob: 0,
      charlie: 0
    })

    expect(result.transactions).toHaveLength(0)
  })

  it('should handle single payment by one person', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 3000,
        description: 'Alice一人で支払い',
        payerId: 'alice',
        participants: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateTotalSettlement(members, payments)

    expect(result.totalAmount).toBe(3000)
    expect(result.perPersonShare).toBe(1000)
    expect(result.remainder).toBe(0)

    // Alice: 支払い3000円、負担1000円 → 残高+2000円
    // Bob: 支払い0円、負担1000円 → 残高-1000円
    // Charlie: 支払い0円、負担1000円 → 残高-1000円
    expect(result.balances).toEqual({
      alice: 2000,
      bob: -1000,
      charlie: -1000
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.transactions).toContainEqual({
      from: 'bob', to: 'alice', amount: 1000
    })
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'alice', amount: 1000
    })
  })
})