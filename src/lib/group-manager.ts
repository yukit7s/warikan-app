import { Group, Member } from '../types/group'

export class GroupManager {
  private storage: Storage
  private readonly storageKey = 'warikan-groups'

  constructor(storage: Storage) {
    this.storage = storage
  }

  createGroup(name: string, memberNames: string[]): Group {
    const now = new Date()
    const group: Group = {
      id: this.generateId(),
      name,
      members: memberNames.map(name => ({
        id: this.generateId(),
        name
      })),
      createdAt: now,
      updatedAt: now
    }

    const groups = this.getAllGroups()
    groups.push(group)
    this.saveGroups(groups)

    return group
  }

  getGroup(id: string): Group | null {
    const groups = this.getAllGroups()
    return groups.find(group => group.id === id) || null
  }

  getAllGroups(): Group[] {
    const stored = this.storage.getItem(this.storageKey)
    if (!stored) {
      return []
    }

    const groups = JSON.parse(stored) as Group[]
    return groups.map((group) => ({
      ...group,
      createdAt: new Date(group.createdAt),
      updatedAt: new Date(group.updatedAt)
    }))
  }

  addMember(groupId: string, memberName: string): Group | null {
    const groups = this.getAllGroups()
    const groupIndex = groups.findIndex(g => g.id === groupId)
    
    if (groupIndex === -1) {
      return null
    }

    const group = groups[groupIndex]
    const newMember: Member = {
      id: this.generateId(),
      name: memberName
    }

    group.members.push(newMember)
    group.updatedAt = new Date()

    groups[groupIndex] = group
    this.saveGroups(groups)

    return group
  }

  removeMember(groupId: string, memberId: string): Group | null {
    const groups = this.getAllGroups()
    const groupIndex = groups.findIndex(g => g.id === groupId)
    
    if (groupIndex === -1) {
      return null
    }

    const group = groups[groupIndex]
    group.members = group.members.filter(m => m.id !== memberId)
    group.updatedAt = new Date()

    groups[groupIndex] = group
    this.saveGroups(groups)

    return group
  }

  updateGroupName(groupId: string, newName: string): Group | null {
    const groups = this.getAllGroups()
    const groupIndex = groups.findIndex(g => g.id === groupId)
    
    if (groupIndex === -1) {
      return null
    }

    const group = groups[groupIndex]
    group.name = newName
    group.updatedAt = new Date()

    groups[groupIndex] = group
    this.saveGroups(groups)

    return group
  }

  updateGroup(groupId: string, updates: Partial<Omit<Group, 'id' | 'createdAt' | 'updatedAt'>>): Group | null {
    const groups = this.getAllGroups()
    const groupIndex = groups.findIndex(g => g.id === groupId)
    
    if (groupIndex === -1) {
      return null
    }

    const group = groups[groupIndex]
    const updatedGroup = {
      ...group,
      ...updates,
      updatedAt: new Date()
    }

    groups[groupIndex] = updatedGroup
    this.saveGroups(groups)

    return updatedGroup
  }

  deleteGroup(groupId: string): boolean {
    const groups = this.getAllGroups()
    const filteredGroups = groups.filter(g => g.id !== groupId)
    
    if (filteredGroups.length === groups.length) {
      return false
    }

    this.saveGroups(filteredGroups)
    return true
  }

  private saveGroups(groups: Group[]): void {
    this.storage.setItem(this.storageKey, JSON.stringify(groups))
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }
}