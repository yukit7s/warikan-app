import { Payment } from '../types/payment'
import { Member } from '../types/group'

export interface TotalSettlementResult {
  totalAmount: number
  perPersonShare: number
  remainder: number
  balances: Record<string, number>
  transactions: Array<{
    from: string
    to: string
    amount: number
  }>
}

export function calculateTotalSettlement(members: Member[], payments: Payment[]): TotalSettlementResult {
  // 総支払額を計算
  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)
  
  // 1人あたりの負担額を計算（均等割り）
  const perPersonShare = Math.floor(totalAmount / members.length)
  const remainder = totalAmount % members.length
  
  // 各メンバーの実際の負担額を計算（あまりを最初の人から順に配分）
  const actualShares: Record<string, number> = {}
  members.forEach((member, index) => {
    actualShares[member.id] = perPersonShare + (index < remainder ? 1 : 0)
  })
  
  // 各メンバーの実際の支払額を計算
  const actualPayments: Record<string, number> = {}
  members.forEach(member => {
    actualPayments[member.id] = 0
  })
  
  payments.forEach(payment => {
    actualPayments[payment.payerId] = (actualPayments[payment.payerId] || 0) + payment.amount
  })
  
  // 残高を計算（支払額 - 負担額）
  const balances: Record<string, number> = {}
  members.forEach(member => {
    const paid = actualPayments[member.id] || 0
    const shouldPay = actualShares[member.id]
    balances[member.id] = paid - shouldPay
  })
  
  // 精算取引を計算
  const transactions = calculateTransactions(balances)
  
  return {
    totalAmount,
    perPersonShare,
    remainder,
    balances,
    transactions
  }
}

function calculateTransactions(balances: Record<string, number>): Array<{from: string; to: string; amount: number}> {
  const transactions: Array<{from: string; to: string; amount: number}> = []
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