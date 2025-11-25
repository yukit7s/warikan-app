import { Settlement } from '../types/settlement'

export class SettlementManager {
  private storage: Storage
  private readonly storageKey = 'warikan-settlements'

  constructor(storage: Storage) {
    this.storage = storage
  }

  createSettlement(
    groupId: string,
    fromMemberId: string,
    toMemberId: string,
    amount: number
  ): Settlement {
    const now = new Date()
    const settlement: Settlement = {
      id: this.generateId(),
      groupId,
      fromMemberId,
      toMemberId,
      amount,
      isCompleted: false,
      createdAt: now,
      updatedAt: now
    }

    const settlements = this.getAllSettlements()
    settlements.push(settlement)
    this.saveSettlements(settlements)

    return settlement
  }

  markSettlementCompleted(settlementId: string): Settlement | null {
    const settlements = this.getAllSettlements()
    const settlementIndex = settlements.findIndex(s => s.id === settlementId)
    
    if (settlementIndex === -1) {
      return null
    }

    const now = new Date()
    const settlement = settlements[settlementIndex]
    const updatedSettlement = {
      ...settlement,
      isCompleted: true,
      completedAt: now,
      updatedAt: now
    }

    settlements[settlementIndex] = updatedSettlement
    this.saveSettlements(settlements)

    return updatedSettlement
  }

  markSettlementIncomplete(settlementId: string): Settlement | null {
    const settlements = this.getAllSettlements()
    const settlementIndex = settlements.findIndex(s => s.id === settlementId)
    
    if (settlementIndex === -1) {
      return null
    }

    const settlement = settlements[settlementIndex]
    const updatedSettlement = {
      ...settlement,
      isCompleted: false,
      completedAt: undefined,
      updatedAt: new Date()
    }

    settlements[settlementIndex] = updatedSettlement
    this.saveSettlements(settlements)

    return updatedSettlement
  }

  getSettlementsByGroup(groupId: string): Settlement[] {
    const allSettlements = this.getAllSettlements()
    return allSettlements.filter(settlement => settlement.groupId === groupId)
  }

  getSettlement(settlementId: string): Settlement | null {
    const settlements = this.getAllSettlements()
    return settlements.find(settlement => settlement.id === settlementId) || null
  }

  deleteSettlement(settlementId: string): boolean {
    const settlements = this.getAllSettlements()
    const filteredSettlements = settlements.filter(s => s.id !== settlementId)
    
    if (filteredSettlements.length === settlements.length) {
      return false
    }

    this.saveSettlements(filteredSettlements)
    return true
  }

  private getAllSettlements(): Settlement[] {
    const stored = this.storage.getItem(this.storageKey)
    if (!stored) {
      return []
    }

    const settlements = JSON.parse(stored) as Settlement[]
    return settlements.map((settlement) => ({
      ...settlement,
      completedAt: settlement.completedAt ? new Date(settlement.completedAt) : undefined,
      createdAt: new Date(settlement.createdAt),
      updatedAt: new Date(settlement.updatedAt)
    }))
  }

  private saveSettlements(settlements: Settlement[]): void {
    this.storage.setItem(this.storageKey, JSON.stringify(settlements))
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}