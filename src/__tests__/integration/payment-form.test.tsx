import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter, useParams } from 'next/navigation'
import AddPaymentPage from '../../app/groups/[id]/add-payment/page'

// Next.jsのルーティング関数をモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn()
}))

// LocalStorageのモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

// ダミーのグループとメンバーデータ
const mockGroup = {
  id: 'group1',
  name: 'テストグループ',
  members: [
    { id: 'alice', name: 'Alice' },
    { id: 'bob', name: 'Bob' },
    { id: 'charlie', name: 'Charlie' }
  ],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01')
}

describe('AddPaymentPage Integration Tests', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    })
    ;(useParams as jest.Mock).mockReturnValue({
      id: 'group1'
    })
    
    // グループデータをLocalStorageに設定
    mockLocalStorage.getItem.mockImplementation((key: string) => {
      if (key === 'warikan-groups') {
        return JSON.stringify([mockGroup])
      }
      if (key === 'warikan-payments') {
        return JSON.stringify([])
      }
      return null
    })
  })

  it('should render payment form with group members', async () => {
    render(<AddPaymentPage />)

    // グループ名が表示されている
    await waitFor(() => {
      expect(screen.getByText('テストグループ に戻る')).toBeInTheDocument()
    })

    // フォームの各フィールドが存在する
    expect(screen.getByLabelText('金額')).toBeInTheDocument()
    expect(screen.getByLabelText('内容')).toBeInTheDocument()
    expect(screen.getByLabelText('支払者')).toBeInTheDocument()
    
    // メンバー選択チェックボックスが存在する
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
    expect(screen.getByText('Charlie')).toBeInTheDocument()
  })

  it('should handle participant selection correctly', async () => {
    render(<AddPaymentPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('金額')).toBeInTheDocument()
    })

    // 金額を入力
    const amountInput = screen.getByLabelText('金額')
    fireEvent.change(amountInput, { target: { value: '3000' } })

    // 均等割りを選択（デフォルト）
    const equalSplitRadio = screen.getByLabelText('均等割り')
    expect(equalSplitRadio).toBeChecked()

    // 全メンバーが選択されている（デフォルト）
    const aliceCheckbox = screen.getByRole('checkbox', { name: /Alice/ })
    const bobCheckbox = screen.getByRole('checkbox', { name: /Bob/ })
    const charlieCheckbox = screen.getByRole('checkbox', { name: /Charlie/ })

    await waitFor(() => {
      expect(aliceCheckbox).toBeChecked()
      expect(bobCheckbox).toBeChecked()
      expect(charlieCheckbox).toBeChecked()
    })

    // Charlieの選択を解除
    fireEvent.click(charlieCheckbox)

    await waitFor(() => {
      expect(charlieCheckbox).not.toBeChecked()
    })

    // 均等割りの金額表示を確認
    await waitFor(() => {
      // Alice と Bob のみ選択されているので、1500円ずつ
      const participantShares = screen.getAllByText('¥1,500')
      expect(participantShares).toHaveLength(2)
    })
  })

  it('should handle custom split correctly', async () => {
    render(<AddPaymentPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('金額')).toBeInTheDocument()
    })

    // 金額と内容を入力
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1000' } })
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: 'テスト支払い' } })

    // 個別指定を選択
    const customSplitRadio = screen.getByLabelText('個別指定')
    fireEvent.click(customSplitRadio)

    await waitFor(() => {
      expect(customSplitRadio).toBeChecked()
    })

    // Alice のみを選択
    const aliceCheckbox = screen.getByRole('checkbox', { name: /Alice/ })
    const bobCheckbox = screen.getByRole('checkbox', { name: /Bob/ })
    const charlieCheckbox = screen.getByRole('checkbox', { name: /Charlie/ })

    // デフォルトで全員選択されているので、Bob と Charlie を解除
    fireEvent.click(bobCheckbox)
    fireEvent.click(charlieCheckbox)

    await waitFor(() => {
      expect(aliceCheckbox).toBeChecked()
      expect(bobCheckbox).not.toBeChecked()
      expect(charlieCheckbox).not.toBeChecked()
    })

    // Alice の分担額を入力
    const aliceShareInput = screen.getByDisplayValue('0')
    fireEvent.change(aliceShareInput, { target: { value: '1000' } })

    await waitFor(() => {
      expect(aliceShareInput).toHaveValue(1000)
    })

    // 合計表示が正しく更新される
    await waitFor(() => {
      expect(screen.getByText('¥1,000')).toBeInTheDocument() // 負担額合計
    })
  })

  it('should validate form before submission', async () => {
    render(<AddPaymentPage />)

    await waitFor(() => {
      expect(screen.getByText('支払いを追加')).toBeInTheDocument()
    })

    // 何も入力せずに送信ボタンをクリック
    const submitButton = screen.getByText('支払いを追加')
    fireEvent.click(submitButton)

    // フォームが送信されない（画面遷移しない）
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('should show remainder information for uneven division', async () => {
    render(<AddPaymentPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('金額')).toBeInTheDocument()
    })

    // 3で割り切れない金額を入力
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '1000' } })

    // 均等割り情報が表示される
    await waitFor(() => {
      expect(screen.getByText('💡 均等割り情報')).toBeInTheDocument()
      expect(screen.getByText(/1人あたり.*¥333円/)).toBeInTheDocument()
      expect(screen.getByText(/あまり.*1円/)).toBeInTheDocument()
    })
  })

  it('should submit form successfully with valid data', async () => {
    render(<AddPaymentPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('金額')).toBeInTheDocument()
    })

    // フォームに有効なデータを入力
    fireEvent.change(screen.getByLabelText('金額'), { target: { value: '3000' } })
    fireEvent.change(screen.getByLabelText('内容'), { target: { value: 'テスト支払い' } })

    // 送信
    const submitButton = screen.getByText('支払いを追加')
    fireEvent.click(submitButton)

    // LocalStorageに保存される
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'warikan-payments',
        expect.any(String)
      )
    })

    // グループ詳細ページにリダイレクト
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/groups/group1')
    })
  })
})