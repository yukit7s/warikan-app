# ADR-002: 分担方式の設計決定

## ステータス
採用済み

## 日付
2025年11月25日

## 背景
割り勘アプリにおいて、ユーザーから「支払い項目は、グループ内の誰がその支払いを負担するか（割り勘するか）も選択できるようにしてください」「精支払いごとに割り勘ではなく、総額を割り勘するように修正してください」「支払い情報を誰が分担するか選択する機能がなくなったので復活させてください」という相反する要求があった。

これらの要求を満たすため、柔軟な分担方式の設計が必要となった。

## 決定事項

### 1. 二つの分担アルゴリズムの並行実装

#### 支払いごと分担方式（`calculateSettlement`）
```typescript
// 各支払いで参加者を個別に選択
payment.participants = [
  { memberId: 'alice', share: 1500 },
  { memberId: 'bob', share: 1500 }
  // charlieは参加しない
]
```

#### 総額割り勘方式（`calculateTotalSettlement`）
```typescript
// 全支払いの合計を全メンバーで均等分割
const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
const perPersonShare = Math.floor(totalAmount / members.length)
```

### 2. 参加者選択UIの実装
- **均等割り**: 選択されたメンバー間での自動均等分割
- **個別指定**: メンバーごとの負担額手動設定
- **リアルタイム計算**: 入力変更に応じたあまり表示

### 3. データモデル設計
```typescript
interface Participant {
  memberId: string
  share: number  // 実際の負担額
}

interface Payment {
  participants: Participant[]  // 空配列の場合は総額割り勘
}
```

## 理由

### 問題分析
1. **初期実装**: 支払いごと分担のみ
2. **ユーザー要求1**: 総額割り勘への変更要求
3. **ユーザー要求2**: 支払いごと分担の復活要求
4. **最終要求**: 両方の機能が必要

### 設計判断の根拠
1. **後方互換性**: 既存のparticipants配列構造を維持
2. **段階的移行**: 総額割り勘時はparticipants配列を空にする方式を検討したが棄却
3. **明示的選択**: ユーザーが分担方式を明確に選択できる設計
4. **計算精度**: あまり処理の適切な実装

### TDDによる品質保証
```typescript
// 支払いごと分担テスト
it('should correctly handle payments with different participant sets', () => {
  // Alice & Bob のみの支払い + 全員での支払い
  expect(result.balances).toEqual({
    alice: -500,   // 1500 + 2000 - 3000
    bob: 2500,     // 1500 + 2000 - 6000 + 3000
    charlie: -2000 // 2000 - 0
  })
})
```

## 実装詳細

### 1. あまり処理アルゴリズム
```typescript
const baseShare = Math.floor(totalAmount / memberIds.length)
const remainder = totalAmount % memberIds.length

// 最初のremainder人が1円追加負担
members.map((memberId, index) => ({
  memberId,
  share: baseShare + (index < remainder ? 1 : 0)
}))
```

### 2. バリデーション機能
```typescript
const totalShares = participants.reduce((sum, p) => sum + p.share, 0)
if (Math.abs(totalShares - amount) > 1) {
  alert(`参加者の負担額の合計が支払い金額と一致しません`)
  return
}
```

### 3. UI状態管理
```typescript
const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal')
const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set())
const [participants, setParticipants] = useState<Participant[]>([])
```

## 結果

### 機能実現
1. **柔軟な分担選択**: ユーザーが支払いごとに参加者を自由に選択
2. **あまり処理**: 3000円÷3人 = 1000円ずつの正確な計算
3. **リアルタイムフィードバック**: 入力に応じた即座の計算結果表示
4. **編集機能**: 既存支払いの分担情報変更可能

### テストカバレッジ
- **6つの統合テストケース**: 複雑なシナリオの動作保証
- **エッジケース対応**: 空の参加者配列、不均等分担、計算誤差
- **UIテスト**: フォーム操作とリアルタイム計算の検証

### ユーザビリティ向上
1. **直感的操作**: チェックボックスによる参加者選択
2. **視覚的フィードバック**: あまり情報の分かりやすい表示
3. **エラー防止**: 負担額合計と支払額の自動検証

## トレードオフ

### 採用したトレードオフ
1. **複雑性 vs 柔軟性**: UI状態管理の複雑化と引き換えに高い柔軟性を獲得
2. **パフォーマンス vs UX**: リアルタイム計算による若干のパフォーマンス負荷とUX向上
3. **開発工数 vs 機能性**: 二つのアルゴリズム実装による工数増加と完全な機能実現

### 棄却した代替案
1. **単一アルゴリズム**: ユーザー要求に完全に応えられない
2. **設定による切り替え**: グループレベルでの固定的な分担方式
3. **総額割り勘完全移行**: 既存データとの互換性問題

## 学習された知見

### 要求分析の重要性
1. **相反する要求**: 段階的な要求変更により設計の柔軟性が必要
2. **ユーザーテスト**: 実装後のフィードバックによる仕様変更の発生
3. **段階的開発**: 機能追加による既存機能への影響

### TDDの効果
1. **安全なリファクタリング**: 計算ロジック変更時の既存機能保護
2. **仕様の明文化**: テストケースによる分担ルールの明確化
3. **回帰防止**: "999円 vs 1000円" 問題の早期発見

## 関連ファイル
- `src/lib/settlement.ts`: 支払いごと分担アルゴリズム
- `src/lib/total-settlement.ts`: 総額割り勘アルゴリズム  
- `src/lib/payment-manager.ts`: 均等割り計算機能
- `src/lib/__tests__/participant-selection.test.ts`: 統合テスト
- `src/app/groups/[id]/add-payment/page.tsx`: 分担選択UI

## 更新履歴
- 2025-11-25: 初版作成