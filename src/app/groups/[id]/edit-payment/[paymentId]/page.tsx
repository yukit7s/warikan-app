'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GroupManager } from '@/lib/group-manager'
import { PaymentManager } from '@/lib/payment-manager'
import { Group } from '@/types/group'
import { Payment, Participant } from '@/types/payment'

export default function EditPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params.id as string
  const paymentId = params.paymentId as string

  const [group, setGroup] = useState<Group | null>(null)
  const [payment, setPayment] = useState<Payment | null>(null)
  const [paymentManager, setPaymentManager] = useState<PaymentManager | null>(null)

  const [amount, setAmount] = useState<number>(0)
  const [description, setDescription] = useState<string>('')
  const [payerId, setPayerId] = useState<string>('')
  const [participants, setParticipants] = useState<Participant[]>([])
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
  const [splitInfo, setSplitInfo] = useState<{baseAmount: number; remainder: number; hasRemainder: boolean} | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && groupId && paymentId) {
      const gManager = new GroupManager(localStorage)
      const pManager = new PaymentManager(localStorage)
      
      setPaymentManager(pManager)
      
      const groupData = gManager.getGroup(groupId)
      setGroup(groupData)

      const paymentData = pManager.getPayment(paymentId)
      setPayment(paymentData)

      if (paymentData) {
        setAmount(paymentData.amount)
        setDescription(paymentData.description)
        setPayerId(paymentData.payerId)
        setParticipants(paymentData.participants)
        
        // 参加者がいる場合は custom、いない場合は equal
        if (paymentData.participants.length > 0) {
          setSplitType('custom')
          setSelectedMembers(new Set(paymentData.participants.map(p => p.memberId)))
        } else {
          setSplitType('equal')
          if (groupData) {
            setSelectedMembers(new Set(groupData.members.map(m => m.id)))
          }
        }
      }
    }
  }, [groupId, paymentId])

  useEffect(() => {
    const updateParticipants = () => {
      if (group && paymentManager && splitType === 'equal') {
        const memberIds = Array.from(selectedMembers)
        if (memberIds.length > 0 && amount > 0) {
          const shareInfo = paymentManager.calculateEqualSharesWithInfo(memberIds, amount)
          setParticipants(shareInfo.participants)
          setSplitInfo({
            baseAmount: shareInfo.baseAmount,
            remainder: shareInfo.remainder,
            hasRemainder: shareInfo.hasRemainder
          })
        } else {
          setParticipants([])
          setSplitInfo(null)
        }
      } else if (splitType === 'custom') {
        const memberIds = Array.from(selectedMembers)
        setParticipants(prev => {
          const customParticipants = memberIds.map(memberId => ({
            memberId,
            share: prev.find(p => p.memberId === memberId)?.share || 0
          }))
          return customParticipants
        })
      }
    }

    updateParticipants()
  }, [amount, selectedMembers, splitType, group, paymentManager])

  const handleMemberSelection = (memberId: string, checked: boolean) => {
    const newSelected = new Set(selectedMembers)
    if (checked) {
      newSelected.add(memberId)
    } else {
      newSelected.delete(memberId)
    }
    setSelectedMembers(newSelected)
  }

  const handleCustomShareChange = (memberId: string, share: number) => {
    setParticipants(prev => 
      prev.map(p => 
        p.memberId === memberId ? { ...p, share } : p
      )
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!paymentManager || !group || !payment) return
    if (amount <= 0 || !description.trim() || !payerId) return
    if (participants.length === 0) return

    const totalShares = participants.reduce((sum, p) => sum + p.share, 0)
    if (Math.abs(totalShares - amount) > 1) {
      alert(`参加者の負担額の合計が支払い金額と一致しません\n支払額: ${amount}円\n負担額合計: ${totalShares}円\n差額: ${Math.abs(totalShares - amount)}円`)
      return
    }

    try {
      paymentManager.updatePayment(paymentId, {
        amount,
        description,
        payerId,
        participants
      })
      router.push(`/groups/${groupId}`)
    } catch (error) {
      console.error('Error updating payment:', error)
      alert('支払いの更新に失敗しました')
    }
  }

  if (!group || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">支払いが見つかりません</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mt-2">支払いを編集</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* 金額入力 */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              金額
            </label>
            <input
              type="number"
              id="amount"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
              placeholder="0"
              required
            />
          </div>

          {/* 内容入力 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              内容
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium placeholder-gray-400"
              placeholder="例: ディナー、タクシー代"
              required
            />
          </div>

          {/* 支払者選択 */}
          <div>
            <label htmlFor="payer" className="block text-sm font-medium text-gray-700 mb-2">
              支払者
            </label>
            <select
              id="payer"
              value={payerId}
              onChange={(e) => setPayerId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium"
              required
            >
              {group.members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* 割り勘タイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              割り勘方法
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="equal"
                  checked={splitType === 'equal'}
                  onChange={(e) => setSplitType('equal')}
                  className="mr-2"
                />
                均等割り
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="custom"
                  checked={splitType === 'custom'}
                  onChange={(e) => setSplitType('custom')}
                  className="mr-2"
                />
                個別指定
              </label>
            </div>
          </div>

          {/* 参加者選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              参加者（負担者）
            </label>
            <div className="space-y-3">
              {group.members.map(member => {
                const isSelected = selectedMembers.has(member.id)
                const participant = participants.find(p => p.memberId === member.id)
                
                return (
                  <div key={member.id} className="flex items-center justify-between p-3 border rounded-md">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleMemberSelection(member.id, e.target.checked)}
                        className="mr-3"
                      />
                      <span className="font-medium">{member.name}</span>
                    </label>
                    
                    {isSelected && (
                      <div className="flex items-center">
                        {splitType === 'equal' ? (
                          <span className="text-gray-600">
                            ¥{participant?.share?.toLocaleString() || 0}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={participant?.share || 0}
                            onChange={(e) => handleCustomShareChange(member.id, Number(e.target.value))}
                            className="w-24 border border-gray-300 rounded px-2 py-1 text-right text-gray-900 font-medium placeholder-gray-400"
                            placeholder="0"
                            min="0"
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 合計表示 */}
            {participants.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                {splitType === 'equal' && splitInfo?.hasRemainder && (
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="font-medium text-blue-800 mb-1">💡 均等割り情報</div>
                    <div className="text-blue-700">
                      1人あたり <strong>¥{splitInfo.baseAmount.toLocaleString()}円</strong>、
                      あまり <strong>{splitInfo.remainder}円</strong> を
                      <strong>{splitInfo.remainder}人</strong>が追加負担
                    </div>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>負担額合計:</span>
                  <span className={`font-semibold ${
                    Math.abs(participants.reduce((sum, p) => sum + p.share, 0) - amount) <= 1 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    ¥{participants.reduce((sum, p) => sum + p.share, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>支払い金額:</span>
                  <span>¥{amount.toLocaleString()}</span>
                </div>
              </div>
            )}
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
            >
              支払いを更新
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}