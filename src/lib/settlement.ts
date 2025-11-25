import { Payment } from '../types/payment'
import { Member } from '../types/group'
import { Settlement } from '../types/settlement'
import { SettlementSummary } from '../types/settlement'

export interface Transaction {
  from: string
  to: string
  amount: number
}

export interface SettlementResult {
  balances: Record<string, number>
  transactions: Transaction[]
}

export function calculateSettlementWithHistory(
  members: Member[], 
  payments: Payment[], 
  settlements: Settlement[]
): SettlementSummary {
  const baseResult = calculateSettlement(members, payments)
  
  // 完了済みの精算を考慮して調整
  const adjustedTransactions = baseResult.transactions.map(transaction => {
    const existingSettlement = settlements.find(s => 
      s.fromMemberId === transaction.from && 
      s.toMemberId === transaction.to && 
      Math.abs(s.amount - transaction.amount) < 1
    )
    
    return {
      ...transaction,
      isCompleted: existingSettlement?.isCompleted || false,
      settlementId: existingSettlement?.id
    }
  })

  return {
    balances: baseResult.balances,
    transactions: adjustedTransactions
  }
}

export function calculateSettlement(members: Member[], payments: Payment[]): SettlementResult {
  const balances: Record<string, number> = {}
  
  // 全メンバーの残高を0で初期化
  members.forEach(member => {
    balances[member.id] = 0
  })

  // 各支払いについて残高を計算
  payments.forEach(payment => {
    // 支払者の残高を増加
    balances[payment.payerId] += payment.amount
    
    // 各参加者の残高から負担分を減少
    payment.participants.forEach(participant => {
      balances[participant.memberId] -= participant.share
    })
  })

  // 精算取引を計算
  const transactions = calculateTransactions(balances)

  return {
    balances,
    transactions
  }
}

function calculateTransactions(balances: Record<string, number>): Transaction[] {
  const transactions: Transaction[] = []
  const creditors: Array<{ id: string; amount: number }> = []
  const debtors: Array<{ id: string; amount: number }> = []

  // 債権者と債務者を分類
  Object.entries(balances).forEach(([memberId, balance]) => {
    if (balance > 0) {
      creditors.push({ id: memberId, amount: balance })
    } else if (balance < 0) {
      debtors.push({ id: memberId, amount: -balance })
    }
  })

  // 債権者を残高の降順でソート
  creditors.sort((a, b) => b.amount - a.amount)
  // 債務者を残高の降順でソート
  debtors.sort((a, b) => b.amount - a.amount)

  let creditorIndex = 0
  let debtorIndex = 0

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex]
    const debtor = debtors[debtorIndex]

    const transferAmount = Math.min(creditor.amount, debtor.amount)

    transactions.push({
      from: debtor.id,
      to: creditor.id,
      amount: transferAmount
    })

    creditor.amount -= transferAmount
    debtor.amount -= transferAmount

    if (creditor.amount === 0) {
      creditorIndex++
    }
    if (debtor.amount === 0) {
      debtorIndex++
    }
  }

  return transactions
}