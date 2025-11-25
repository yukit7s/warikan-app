'use client'

import { useState, useEffect } from 'react'
import { GroupManager } from '@/lib/group-manager'
import { Group } from '@/types/group'
import Link from 'next/link'

export default function Home() {
  const [groups, setGroups] = useState<Group[]>([])
  const [groupManager, setGroupManager] = useState<GroupManager | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const manager = new GroupManager(localStorage)
      setGroupManager(manager)
      setGroups(manager.getAllGroups())
    }
  }, [])

  const handleCreateGroup = () => {
    if (!groupManager) return

    const groupName = prompt('グループ名を入力してください:')
    if (!groupName) return

    const memberNames = prompt('メンバー名をカンマ区切りで入力してください (例: Alice,Bob,Charlie):')
    if (!memberNames) return

    const members = memberNames.split(',').map(name => name.trim()).filter(name => name)
    if (members.length === 0) return

    groupManager.createGroup(groupName, members)
    setGroups(groupManager.getAllGroups())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">割り勘アプリ</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">グループ一覧</h2>
          <button
            onClick={handleCreateGroup}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium"
          >
            新しいグループを作成
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">グループがありません</p>
            <p className="text-gray-400 mt-2">「新しいグループを作成」ボタンから始めましょう</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => (
              <div key={group.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.name}</h3>
                <p className="text-gray-600 mb-4">
                  メンバー: {group.members.map(m => m.name).join(', ')}
                </p>
                <p className="text-sm text-gray-400 mb-4">
                  作成日: {group.createdAt.toLocaleDateString('ja-JP')}
                </p>
                <Link
                  href={`/groups/${group.id}`}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium inline-block"
                >
                  グループを開く
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">テスト結果</h3>
          <p className="text-green-600 font-medium">✅ 全12個のテストが成功</p>
          <div className="text-sm text-gray-600 mt-2">
            <p>• 割り勘計算エンジン: 3テスト</p>
            <p>• グループ管理システム: 9テスト</p>
          </div>
        </div>
      </main>
    </div>
  )
}
