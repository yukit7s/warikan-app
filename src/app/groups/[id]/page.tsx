'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GroupManager } from '@/lib/group-manager'
import { PaymentManager } from '@/lib/payment-manager'
import { SettlementManager } from '@/lib/settlement-manager'
import { calculateSettlement } from '@/lib/settlement'
import { Group } from '@/types/group'
import { Payment } from '@/types/payment'
import { Settlement } from '@/types/settlement'

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [groupManager, setGroupManager] = useState<GroupManager | null>(null)
  const [paymentManager, setPaymentManager] = useState<PaymentManager | null>(null)
  const [settlementManager, setSettlementManager] = useState<SettlementManager | null>(null)

  const loadData = () => {
    if (typeof window !== 'undefined' && groupId) {
      const gManager = new GroupManager(localStorage)
      const pManager = new PaymentManager(localStorage)
      const sManager = new SettlementManager(localStorage)
      
      setGroupManager(gManager)
      setPaymentManager(pManager)
      setSettlementManager(sManager)
      
      const groupData = gManager.getGroup(groupId)
      setGroup(groupData)

      const paymentData = pManager.getPaymentsByGroup(groupId)
      setPayments(paymentData)

      const settlementData = sManager.getSettlementsByGroup(groupId)
      setSettlements(settlementData)
    }
  }

  useEffect(() => {
    loadData()
  }, [groupId])

  const handleDeletePayment = (paymentId: string) => {
    if (!paymentManager) return
    
    if (confirm('この支払いを削除しますか？')) {
      paymentManager.deletePayment(paymentId)
      loadData()
    }
  }

  const handleDeleteGroup = () => {
    if (!groupManager) return
    
    if (confirm(`グループ「${group?.name}」を削除しますか？\nこの操作は元に戻せません。`)) {
      groupManager.deleteGroup(groupId)
      router.push('/')
    }
  }


  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">グループが見つかりません</p>
      </div>
    )
  }

  const settlement = calculateSettlement(group.members, payments)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                ← ホームに戻る
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{group.name}</h1>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-2">
                メンバー: {group.members.map(m => m.name).join(', ')}
              </div>
              <div className="flex space-x-2">
                <Link
                  href={`/groups/${groupId}/edit`}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  グループ編集
                </Link>
                <button
                  onClick={handleDeleteGroup}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium"
                >
                  グループ削除
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 支払い履歴 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">支払い履歴</h2>
              <Link
                href={`/groups/${groupId}/add-payment`}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                支払いを追加
              </Link>
            </div>

            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">支払い履歴がありません</p>
            ) : (
              <div className="space-y-4">
                {payments.map(payment => {
                  const payer = group.members.find(m => m.id === payment.payerId)
                  const participantNames = payment.participants
                    .map(p => group.members.find(m => m.id === p.memberId)?.name)
                    .filter(Boolean)
                    .join(', ')

                  return (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{payment.description}</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            支払者: {payer?.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            参加者: {participantNames}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            ¥{payment.amount.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.date.toLocaleDateString('ja-JP')}
                          </p>
                          <div className="flex space-x-2 mt-1">
                            <Link
                              href={`/groups/${groupId}/edit-payment/${payment.id}`}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                            >
                              編集
                            </Link>
                            <button
                              onClick={() => handleDeletePayment(payment.id)}
                              className="text-red-500 hover:text-red-700 text-xs"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 精算状況 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">精算状況</h2>

            {/* 支払い詳細情報 */}
            {payments.length > 0 && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-2">💰 支払い詳細</h3>
                <div className="text-sm">
                  <div className="text-blue-700">
                    総支払額: <span className="font-semibold text-blue-900">¥{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                  </div>
                  <div className="text-blue-700 mt-1">
                    支払い件数: <span className="font-semibold text-blue-900">{payments.length}件</span>
                  </div>
                </div>
              </div>
            )}

            {/* 残高表示 */}
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">各メンバーの残高</h3>
              <div className="space-y-3">
                {group.members.map(member => {
                  const balance = settlement.balances[member.id] || 0
                  const isPositive = balance > 0
                  const isZero = balance === 0

                  return (
                    <div key={member.id} className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{member.name}</span>
                      <span className={`font-semibold ${
                        isZero ? 'text-gray-500' :
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isZero ? '精算済み' : 
                         isPositive ? `+¥${balance.toLocaleString()}` : 
                         `¥${balance.toLocaleString()}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 精算取引 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">必要な精算</h3>
              {settlement.transactions.length === 0 ? (
                <p className="text-green-600 font-medium">✅ 精算完了！</p>
              ) : (
                <div className="space-y-3">
                  {settlement.transactions.map((transaction, index) => {
                    const from = group.members.find(m => m.id === transaction.from)
                    const to = group.members.find(m => m.id === transaction.to)

                    return (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-md"
                      >
                        <div className="flex items-center">
                          <div>
                            <span className="font-medium text-gray-900">
                              {from?.name}
                            </span>
                            <span className="text-gray-600 mx-2">→</span>
                            <span className="font-medium text-gray-900">
                              {to?.name}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-orange-600">
                          ¥{transaction.amount.toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TDDで作成した機能のデモ */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">🧪 TDD実装済み機能</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">割り勘計算エンジン</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• 複数支払いの残高計算</li>
                <li>• 最適な精算取引算出</li>
                <li>• 部分的な負担者対応</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">グループ管理システム</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• グループ作成・編集・削除</li>
                <li>• メンバー追加・削除</li>
                <li>• LocalStorage永続化</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}