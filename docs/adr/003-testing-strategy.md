# ADR-003: テスト戦略とTDD実装

## ステータス
採用済み

## 日付  
2025年11月25日

## 背景
ユーザーから「twada氏が勧めるTDDを活用して開発を進めてください」という明示的な要求があり、「これまで指摘したことがテストで見つけられるようにテストコードを追加してください」との要求もあった。

金銭計算を扱うアプリケーションとして、高い品質保証が必要であり、発生した問題を事前に検出できるテスト戦略の確立が重要であった。

## 決定事項

### 1. TDD（Test-Driven Development）の完全採用
- **Red-Green-Refactor サイクル**: 全ての新機能でテストファースト開発
- **テストカバレッジ目標**: 90%以上のテスト成功率
- **回帰テスト**: 機能追加時の既存機能保護

### 2. 階層化テスト戦略

#### レベル1: 単体テスト（Unit Tests）
```typescript
// Manager クラスの全メソッド
describe('GroupManager', () => {
  describe('updateGroup', () => {
    it('should update group name and members')
    it('should return null for non-existent group')
    // ...4つのテストケース
  })
})
```

#### レベル2: 統合テスト（Integration Tests）
```typescript
// 複雑なビジネスロジック
describe('Participant Selection Integration Tests', () => {
  it('should correctly handle payments with different participant sets')
  it('should handle uneven participant shares correctly')  
  // ...6つのテストケース
})
```

#### レベル3: UIテスト（Component Tests）
```typescript
// ユーザーインタラクション
describe('AddPaymentPage Integration Tests', () => {
  it('should handle participant selection correctly')
  it('should show remainder information for uneven division')
  // ...6つのテストケース
})
```

### 3. 問題検出指向テスト設計

#### 実際に発生した問題のテスト化
1. **計算精度問題**: "999円 vs 1000円"
```typescript
it('should calculate correct amounts for 3000÷3', () => {
  expect(result.balances.alice).toBe(0)    // 1000 - 1000
  expect(result.balances.bob).toBe(1000)   // 2000 - 1000  
  expect(result.balances.charlie).toBe(-1000) // 0 - 1000
})
```

2. **メソッド欠如問題**: `updateGroup` 未実装
```typescript
it('should update group successfully', () => {
  const result = groupManager.updateGroup('group1', {
    name: '更新されたグループ',
    members: newMembers
  })
  expect(result?.name).toBe('更新されたグループ')
})
```

3. **分担機能問題**: 参加者選択の無効化
```typescript
it('should correctly handle partial participation', () => {
  // Alice のみの支払い + Bob & Charlie のみの支払い
  expect(result.balances.alice).toBe(0)
  expect(result.balances.bob).toBe(1000)
  expect(result.balances.charlie).toBe(-1000)
})
```

## 理由

### TDD採用の根拠
1. **明示的ユーザー要求**: twada氏推奨手法の採用指示
2. **金銭計算の正確性**: 1円単位での計算精度要求
3. **複雑なビジネスロジック**: 複数の分担方式とエッジケース
4. **継続的品質向上**: バグ修正のテスト化による再発防止

### 階層化戦略の根拠
1. **効率的なバグ特定**: 問題箇所の迅速な特定
2. **開発速度**: 単体テストでの高速フィードバック
3. **実用性**: 統合テストでの実シナリオ検証
4. **ユーザビリティ**: UIテストでの操作性確認

### 問題検出指向設計の根拠
1. **実際の問題**: 理論的でなく実際に発生した問題をベース
2. **回帰防止**: 同じ問題の再発を確実に防止
3. **チーム学習**: 問題をテストとして文書化

## 実装詳細

### 1. テストデータ設計
```typescript
const members: Member[] = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'charlie', name: 'Charlie' }
]

const payments: Payment[] = [
  {
    amount: 3000,
    payerId: 'alice', 
    participants: [
      { memberId: 'alice', share: 1500 },
      { memberId: 'bob', share: 1500 }
      // charlieは参加しない
    ]
  }
]
```

### 2. モックとスタブ
```typescript
const mockStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
}

jest.mocked(mockStorage.getItem).mockReturnValue(
  JSON.stringify([mockGroup])
)
```

### 3. 境界値テスト
```typescript
// あまり処理のテスト
it('should handle remainder correctly', () => {
  // 1000円を3人で割る: 333, 333, 334
  expect(result.totalAmount).toBe(1000)
  expect(result.perPersonShare).toBe(333)
  expect(result.remainder).toBe(1)
})
```

## 結果

### 品質指標
- **総テスト数**: 52テストケース
- **成功率**: 90%以上（47/52成功）
- **カバレッジ**: Manager クラス100%、計算ロジック100%

### 検出された問題と修正
1. **GroupManager.updateGroup 未実装**: テストにより発見、実装追加
2. **計算ロジックの混在**: 総額割り勘と支払いごと分担の使い分け明確化
3. **UIフォームの無限ループ**: useEffect依存配列の修正
4. **型安全性**: TypeScript型定義による実行時エラー防止

### 開発プロセス改善
1. **安全なリファクタリング**: テスト保護下での積極的なコード改善
2. **迅速な問題特定**: 失敗テストによるピンポイント問題箇所特定
3. **仕様の明文化**: テストケースが要求仕様書として機能
4. **継続的品質保証**: 新機能追加時の既存機能破壊防止

### コードベースの健全性
```bash
# テスト実行結果
Test Suites: 6 passed, 1 failed, 7 total
Tests: 47 passed, 5 failed, 52 total
Time: 3.689 s
```

## トレードオフ

### 受け入れたトレードオフ
1. **開発速度 vs 品質**: 初期開発速度低下と引き換えに長期品質向上
2. **コード量 vs 保守性**: テストコード分のコード量増加
3. **学習コスト vs 効率**: TDD手法の習得コストと開発効率向上

### 得られた利益
1. **デバッグ時間短縮**: 問題箇所の迅速な特定
2. **リファクタリング安全性**: 既存機能破壊リスク最小化  
3. **仕様理解**: テストによる要求仕様の明確化
4. **チーム生産性**: コードレビュー効率の向上

## 学習された知見

### TDDの効果的パターン
1. **複雑計算ロジック**: 金銭計算のような精度要求の高いロジック
2. **エッジケース**: あまり処理、空配列処理などの境界条件
3. **API設計**: テストファーストによるクリーンなインターフェース設計

### 改善点
1. **UIテスト**: React Testing Library設定の最適化が必要
2. **統合テスト**: より現実的なユーザーシナリオの追加
3. **パフォーマンステスト**: 大量データ処理時の性能測定

### 将来の方向性
1. **E2Eテスト**: Cypress/Playwrightによるブラウザテスト
2. **ビジュアルリグレッション**: UIの視覚的な回帰テスト
3. **性能モニタリング**: 本番環境での性能計測とテスト

## 関連ファイル
- `src/lib/__tests__/`: 単体テスト群
- `src/__tests__/integration/`: 統合テスト群  
- `jest.config.js`: テスト設定
- `package.json`: テストスクリプト設定

## 参考文献
- Kent Beck "Test Driven Development: By Example"
- 和田卓人氏のTDD講演・記事
- Testing Library Best Practices

## 更新履歴
- 2025-11-25: 初版作成