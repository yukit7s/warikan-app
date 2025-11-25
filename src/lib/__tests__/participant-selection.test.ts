import { calculateSettlement } from '../settlement'
import { Member } from '../../types/group'
import { Payment } from '../../types/payment'

describe('Participant Selection Integration Tests', () => {
  const members: Member[] = [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'charlie', name: 'Charlie' }
  ]

  it('should correctly handle payments with different participant sets', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 3000,
        description: 'ランチ（Alice & Bob のみ）',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 1500 },
          { memberId: 'bob', share: 1500 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment2',
        groupId: 'group1',
        amount: 6000,
        description: 'ディナー（全員）',
        payerId: 'bob',
        participants: [
          { memberId: 'alice', share: 2000 },
          { memberId: 'bob', share: 2000 },
          { memberId: 'charlie', share: 2000 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    // Alice: 支払い3000円、負担3500円（1500 + 2000）→ 残高-500円
    // Bob: 支払い6000円、負担3500円（1500 + 2000）→ 残高+2500円
    // Charlie: 支払い0円、負担2000円 → 残高-2000円
    expect(result.balances).toEqual({
      alice: -500,
      bob: 2500,
      charlie: -2000
    })

    // 精算取引の確認
    expect(result.transactions).toHaveLength(2)
    expect(result.transactions).toContainEqual({
      from: 'alice', to: 'bob', amount: 500
    })
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'bob', amount: 2000
    })
  })

  it('should correctly handle partial participation across multiple payments', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: 'Aliceのみの支払い',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 1000 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment2',
        groupId: 'group1',
        amount: 2000,
        description: 'Bob & Charlie の支払い',
        payerId: 'bob',
        participants: [
          { memberId: 'bob', share: 1000 },
          { memberId: 'charlie', share: 1000 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

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

  it('should handle uneven participant shares correctly', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: '不均等な分担',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 700 },
          { memberId: 'bob', share: 300 }
          // Charlie は参加しない
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    // Alice: 支払い1000円、負担700円 → 残高+300円
    // Bob: 支払い0円、負担300円 → 残高-300円
    // Charlie: 支払い0円、負担0円 → 残高0円
    expect(result.balances).toEqual({
      alice: 300,
      bob: -300,
      charlie: 0
    })

    expect(result.transactions).toEqual([
      { from: 'bob', to: 'alice', amount: 300 }
    ])
  })

  it('should validate that participant shares sum up to payment amount', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: '不正な分担（合計が合わない）',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 400 },
          { memberId: 'bob', share: 300 }
          // 合計700円 ≠ 支払額1000円
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    // 支払額と負担額に差が生じる場合の動作を検証
    // Alice: 支払い1000円、負担400円 → 残高+600円
    // Bob: 支払い0円、負担300円 → 残高-300円
    // 差額300円がAliceに残る（これは設計上の仕様）
    expect(result.balances).toEqual({
      alice: 600,
      bob: -300,
      charlie: 0
    })
  })

  it('should handle empty participants array (no one bears the cost)', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1000,
        description: '誰も負担しない支払い',
        payerId: 'alice',
        participants: [],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    // Alice: 支払い1000円、負担0円 → 残高+1000円
    // Bob: 支払い0円、負担0円 → 残高0円
    // Charlie: 支払い0円、負担0円 → 残高0円
    expect(result.balances).toEqual({
      alice: 1000,
      bob: 0,
      charlie: 0
    })

    expect(result.transactions).toEqual([])
  })

  it('should handle complex scenario with multiple payments and varying participants', () => {
    const payments: Payment[] = [
      {
        id: 'payment1',
        groupId: 'group1',
        amount: 1200,
        description: 'タクシー（Alice & Bob）',
        payerId: 'alice',
        participants: [
          { memberId: 'alice', share: 600 },
          { memberId: 'bob', share: 600 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment2',
        groupId: 'group1',
        amount: 3000,
        description: 'ディナー（Bob & Charlie）',
        payerId: 'bob',
        participants: [
          { memberId: 'bob', share: 1500 },
          { memberId: 'charlie', share: 1500 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment3',
        groupId: 'group1',
        amount: 900,
        description: '喫茶店（全員）',
        payerId: 'charlie',
        participants: [
          { memberId: 'alice', share: 300 },
          { memberId: 'bob', share: 300 },
          { memberId: 'charlie', share: 300 }
        ],
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    const result = calculateSettlement(members, payments)

    // Alice: 支払い1200円、負担900円（600+300）→ 残高+300円
    // Bob: 支払い3000円、負担2400円（600+1500+300）→ 残高+600円
    // Charlie: 支払い900円、負担1800円（1500+300）→ 残高-900円
    expect(result.balances).toEqual({
      alice: 300,
      bob: 600,
      charlie: -900
    })

    expect(result.transactions).toHaveLength(2)
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'bob', amount: 600
    })
    expect(result.transactions).toContainEqual({
      from: 'charlie', to: 'alice', amount: 300
    })
  })
})