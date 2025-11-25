import { Payment, Participant } from '../types/payment'

export class PaymentManager {
  private storage: Storage
  private readonly storageKey = 'warikan-payments'

  constructor(storage: Storage) {
    this.storage = storage
  }

  createPayment(
    groupId: string,
    amount: number,
    description: string,
    payerId: string,
    participants: Participant[]
  ): Payment {
    const now = new Date()
    const payment: Payment = {
      id: this.generateId(),
      groupId,
      amount,
      description,
      payerId,
      participants,
      date: now,
      createdAt: now,
      updatedAt: now
    }

    const payments = this.getAllPayments()
    payments.push(payment)
    this.savePayments(payments)

    return payment
  }

  getPaymentsByGroup(groupId: string): Payment[] {
    const allPayments = this.getAllPayments()
    return allPayments.filter(payment => payment.groupId === groupId)
  }

  getPayment(paymentId: string): Payment | null {
    const payments = this.getAllPayments()
    return payments.find(payment => payment.id === paymentId) || null
  }

  updatePayment(paymentId: string, updates: Partial<Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>>): Payment | null {
    const payments = this.getAllPayments()
    const paymentIndex = payments.findIndex(p => p.id === paymentId)
    
    if (paymentIndex === -1) {
      return null
    }

    const payment = payments[paymentIndex]
    const updatedPayment = {
      ...payment,
      ...updates,
      updatedAt: new Date()
    }

    payments[paymentIndex] = updatedPayment
    this.savePayments(payments)

    return updatedPayment
  }

  deletePayment(paymentId: string): boolean {
    const payments = this.getAllPayments()
    const filteredPayments = payments.filter(p => p.id !== paymentId)
    
    if (filteredPayments.length === payments.length) {
      return false
    }

    this.savePayments(filteredPayments)
    return true
  }

  calculateEqualShares(memberIds: string[], totalAmount: number): Participant[] {
    const baseShare = Math.floor(totalAmount / memberIds.length)
    const remainder = totalAmount % memberIds.length

    return memberIds.map((memberId, index) => ({
      memberId,
      share: baseShare + (index < remainder ? 1 : 0)
    }))
  }

  calculateEqualSharesWithInfo(memberIds: string[], totalAmount: number): {
    participants: Participant[]
    baseAmount: number
    remainder: number
    hasRemainder: boolean
  } {
    const baseShare = Math.floor(totalAmount / memberIds.length)
    const remainder = totalAmount % memberIds.length

    const participants = memberIds.map((memberId, index) => ({
      memberId,
      share: baseShare + (index < remainder ? 1 : 0)
    }))

    return {
      participants,
      baseAmount: baseShare,
      remainder,
      hasRemainder: remainder > 0
    }
  }

  private getAllPayments(): Payment[] {
    const stored = this.storage.getItem(this.storageKey)
    if (!stored) {
      return []
    }

    const payments = JSON.parse(stored) as Payment[]
    return payments.map((payment) => ({
      ...payment,
      date: new Date(payment.date),
      createdAt: new Date(payment.createdAt),
      updatedAt: new Date(payment.updatedAt)
    }))
  }

  private savePayments(payments: Payment[]): void {
    this.storage.setItem(this.storageKey, JSON.stringify(payments))
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}