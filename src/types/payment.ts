export interface Participant {
  memberId: string
  share: number
}

export interface Payment {
  id: string
  groupId: string
  amount: number
  description: string
  payerId: string
  participants: Participant[]
  date: Date
  createdAt: Date
  updatedAt: Date
}