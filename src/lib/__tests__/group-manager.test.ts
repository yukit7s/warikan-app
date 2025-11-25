import { GroupManager } from '../group-manager'
import { Group, Member } from '../../types/group'

describe('GroupManager', () => {
  let groupManager: GroupManager
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
    groupManager = new GroupManager(mockStorage)
  })

  describe('createGroup', () => {
    it('should create a new group with members', () => {
      const groupName = 'テストグループ'
      const memberNames = ['Alice', 'Bob', 'Charlie']

      const group = groupManager.createGroup(groupName, memberNames)

      expect(group.name).toBe(groupName)
      expect(group.members).toHaveLength(3)
      expect(group.members.map(m => m.name)).toEqual(memberNames)
      expect(group.id).toBeDefined()
      expect(group.createdAt).toBeInstanceOf(Date)
      expect(group.updatedAt).toBeInstanceOf(Date)
    })

    it('should save group to storage', () => {
      const groupName = 'テストグループ'
      const memberNames = ['Alice', 'Bob']

      groupManager.createGroup(groupName, memberNames)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'warikan-groups',
        expect.any(String)
      )
    })
  })

  describe('getGroup', () => {
    it('should return group by id', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([
        {
          id: 'group1',
          name: 'テストグループ',
          members: [
            { id: 'alice', name: 'Alice' },
            { id: 'bob', name: 'Bob' }
          ],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]))

      const group = groupManager.getGroup('group1')

      expect(group).toBeDefined()
      expect(group?.name).toBe('テストグループ')
      expect(group?.members).toHaveLength(2)
    })

    it('should return null if group not found', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(null)

      const group = groupManager.getGroup('nonexistent')

      expect(group).toBeNull()
    })
  })

  describe('getAllGroups', () => {
    it('should return all groups', () => {
      const mockGroups = [
        {
          id: 'group1',
          name: 'グループ1',
          members: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: 'group2',
          name: 'グループ2',
          members: [],
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        }
      ]

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify(mockGroups))

      const groups = groupManager.getAllGroups()

      expect(groups).toHaveLength(2)
      expect(groups[0].name).toBe('グループ1')
      expect(groups[1].name).toBe('グループ2')
    })

    it('should return empty array if no groups exist', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(null)

      const groups = groupManager.getAllGroups()

      expect(groups).toEqual([])
    })
  })

  describe('addMember', () => {
    it('should add member to group', () => {
      const mockGroup: Group = {
        id: 'group1',
        name: 'テストグループ',
        members: [
          { id: 'alice', name: 'Alice' }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockGroup]))

      const updatedGroup = groupManager.addMember('group1', 'Bob')

      expect(updatedGroup?.members).toHaveLength(2)
      expect(updatedGroup?.members.find(m => m.name === 'Bob')).toBeDefined()
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should return null if group not found', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(null)

      const result = groupManager.addMember('nonexistent', 'Bob')

      expect(result).toBeNull()
    })
  })

  describe('removeMember', () => {
    it('should remove member from group', () => {
      const mockGroup: Group = {
        id: 'group1',
        name: 'テストグループ',
        members: [
          { id: 'alice', name: 'Alice' },
          { id: 'bob', name: 'Bob' }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockGroup]))

      const updatedGroup = groupManager.removeMember('group1', 'alice')

      expect(updatedGroup?.members).toHaveLength(1)
      expect(updatedGroup?.members.find(m => m.id === 'alice')).toBeUndefined()
      expect(mockStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('updateGroup', () => {
    it('should update group name and members', () => {
      const mockGroup: Group = {
        id: 'group1',
        name: 'テストグループ',
        members: [
          { id: 'alice', name: 'Alice' },
          { id: 'bob', name: 'Bob' }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockGroup]))

      const newMembers = [
        { id: 'alice', name: 'Alice' },
        { id: 'bob', name: 'Bob' },
        { id: 'charlie', name: 'Charlie' }
      ]

      const updatedGroup = groupManager.updateGroup('group1', {
        name: '更新されたグループ',
        members: newMembers
      })

      expect(updatedGroup?.name).toBe('更新されたグループ')
      expect(updatedGroup?.members).toHaveLength(3)
      expect(updatedGroup?.members.find(m => m.name === 'Charlie')).toBeDefined()
      expect(updatedGroup?.updatedAt).not.toEqual(mockGroup.updatedAt)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should return null for non-existent group', () => {
      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([]))

      const result = groupManager.updateGroup('nonexistent', { name: '新しい名前' })

      expect(result).toBeNull()
    })

    it('should update only name when members are not provided', () => {
      const mockGroup: Group = {
        id: 'group1',
        name: 'テストグループ',
        members: [
          { id: 'alice', name: 'Alice' },
          { id: 'bob', name: 'Bob' }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockGroup]))

      const updatedGroup = groupManager.updateGroup('group1', {
        name: '名前のみ更新'
      })

      expect(updatedGroup?.name).toBe('名前のみ更新')
      expect(updatedGroup?.members).toEqual(mockGroup.members)
      expect(mockStorage.setItem).toHaveBeenCalled()
    })

    it('should update only members when name is not provided', () => {
      const mockGroup: Group = {
        id: 'group1',
        name: 'テストグループ',
        members: [
          { id: 'alice', name: 'Alice' },
          { id: 'bob', name: 'Bob' }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }

      jest.mocked(mockStorage.getItem).mockReturnValue(JSON.stringify([mockGroup]))

      const newMembers = [{ id: 'alice', name: 'Alice' }]

      const updatedGroup = groupManager.updateGroup('group1', {
        members: newMembers
      })

      expect(updatedGroup?.name).toBe('テストグループ')
      expect(updatedGroup?.members).toHaveLength(1)
      expect(updatedGroup?.members[0].name).toBe('Alice')
      expect(mockStorage.setItem).toHaveBeenCalled()
    })
  })
})