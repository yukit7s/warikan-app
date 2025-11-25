'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GroupManager } from '@/lib/group-manager'
import { Group, Member } from '@/types/group'

export default function EditGroupPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [groupManager, setGroupManager] = useState<GroupManager | null>(null)
  
  const [groupName, setGroupName] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [newMemberName, setNewMemberName] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined' && groupId) {
      const gManager = new GroupManager(localStorage)
      setGroupManager(gManager)
      
      const groupData = gManager.getGroup(groupId)
      if (groupData) {
        setGroup(groupData)
        setGroupName(groupData.name)
        setMembers([...groupData.members])
      }
    }
  }, [groupId])

  const handleAddMember = () => {
    if (newMemberName.trim() && !members.some(m => m.name === newMemberName.trim())) {
      const newMember: Member = {
        id: Math.random().toString(36).substr(2, 9),
        name: newMemberName.trim()
      }
      setMembers([...members, newMember])
      setNewMemberName('')
    }
  }

  const handleRemoveMember = (memberId: string) => {
    if (members.length > 1) {
      setMembers(members.filter(m => m.id !== memberId))
    } else {
      alert('グループには最低1人のメンバーが必要です')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!groupManager || !group) return
    if (!groupName.trim() || members.length === 0) return

    try {
      groupManager.updateGroup(groupId, {
        name: groupName.trim(),
        members
      })
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error updating group:', error)
      alert('グループの更新に失敗しました')
    }
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">グループが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div>
            <Link 
              href={`/groups/${groupId}`} 
              className="text-blue-500 hover:text-blue-600 text-sm font-medium"
            >
              ← {group.name} に戻る
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2">グループを編集</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* グループ名入力 */}
          <div>
            <label htmlFor="groupName" className="block text-sm font-medium text-gray-700 mb-2">
              グループ名
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
              placeholder="例: 旅行グループ"
              required
            />
          </div>

          {/* メンバー管理 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メンバー
            </label>
            
            {/* 既存メンバー一覧 */}
            <div className="space-y-2 mb-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                  <span className="font-medium text-gray-900">{member.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    disabled={members.length <= 1}
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>

            {/* 新メンバー追加 */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
                placeholder="新しいメンバー名"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddMember()
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddMember}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium"
                disabled={!newMemberName.trim()}
              >
                追加
              </button>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <Link
              href={`/groups/${groupId}`}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md text-center font-medium"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md font-medium"
              disabled={!groupName.trim() || members.length === 0}
            >
              グループを更新
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}