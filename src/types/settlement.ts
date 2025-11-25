export interface Settlement {
  id: string
  groupId: string
  fromMemberId: string
  toMemberId: string
  amount: number
  isCompleted: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SettlementSummary {
  balances: Record<string, number>
  transactions: Array<{
    from: string
    to: string
    amount: number
    isCompleted?: boolean
    settlementId?: string
  }>
}