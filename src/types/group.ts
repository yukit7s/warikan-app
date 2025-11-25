export interface Member {
  id: string
  name: string
}

export interface Group {
  id: string
  name: string
  members: Member[]
  createdAt: Date
  updatedAt: Date
}