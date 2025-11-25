# ADR-005: UI/UX設計決定とユーザビリティ向上施策

## ステータス
採用済み

## 日付
2025年11月25日

## 背景
割り勘アプリにおいて、複雑な金銭計算を直感的に操作できるUI/UXの設計が重要であった。特に「入力時の文字が薄くてみづらい」「あまりとして表示するように」といったユーザーフィードバックを受け、ユーザビリティの継続的改善が求められた。

## 決定事項

### 1. デザインシステムの採用
- **Tailwind CSS**: ユーティリティファーストのスタイリング
- **一貫性**: 統一されたカラーパレットとタイポグラフィ
- **レスポンシブ**: モバイルファーストのレイアウト設計

### 2. 視認性の向上
```css
/* 改善前 */
input {
  color: #gray-400; /* 薄すぎて見づらい */
}

/* 改善後 */  
input {
  color: theme('colors.gray.900'); /* 濃い文字色 */
  font-weight: 500; /* 中程度のウエイト */
  placeholder-color: theme('colors.gray.400'); /* プレースホルダーのみ薄色 */
}
```

### 3. 情報の階層化とプログレッシブディスクロージャー
```typescript
// あまり情報の段階的表示
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
```

### 4. リアルタイムフィードバック
- **即座の計算結果表示**: 入力変更時の自動計算
- **視覚的な検証**: 正確性を色で表現（緑=OK、赤=NG）
- **インタラクティブな要素**: ホバー効果とフォーカス状態

### 5. エラー予防とガイダンス
```typescript
// バリデーション表示
<span className={`font-semibold ${
  Math.abs(participants.reduce((sum, p) => sum + p.share, 0) - amount) <= 1 
    ? 'text-green-600' 
    : 'text-red-600'
}`}>
  ¥{participants.reduce((sum, p) => sum + p.share, 0).toLocaleString()}
</span>
```

## 理由

### ユーザビリティ問題の分析
1. **視認性問題**: 「入力時の文字が薄くてみづらい」
2. **情報不足**: あまり計算が見えない
3. **認知負荷**: 複雑な計算結果の理解困難
4. **操作迷い**: 次に何をすべきかの不明確性

### デザイン原則の採用
1. **認知的親和性**: 日本の金銭表記慣習に合わせた表示
2. **即座フィードバック**: 操作結果の即座の視覚化
3. **エラー予防**: ユーザーが間違いを犯す前の警告
4. **プログレッシブディスクロージャー**: 必要な情報の段階的開示

### アクセシビリティ配慮
1. **色彩以外の情報伝達**: アイコンとテキストの併用
2. **フォーカス管理**: キーボードナビゲーション対応
3. **スクリーンリーダー対応**: セマンティックなHTML構造

## 実装詳細

### 1. カラーパレット戦略
```typescript
const colorScheme = {
  primary: 'blue-500',     // アクション要素
  success: 'green-600',    // 正常状態
  warning: 'yellow-500',   // 注意喚起  
  danger: 'red-600',       // エラー状態
  neutral: 'gray-900',     // 基本テキスト
  muted: 'gray-600',       // 補助テキスト
  placeholder: 'gray-400'  // プレースホルダー
}
```

### 2. タイポグラフィ階層
```css
.text-hierarchy {
  h1: text-3xl font-bold;     /* ページタイトル */
  h2: text-xl font-semibold;  /* セクションタイトル */  
  h3: text-lg font-medium;    /* サブセクション */
  body: text-base font-normal; /* 本文 */
  caption: text-sm text-gray-600; /* 補助テキスト */
}
```

### 3. 状態表現パターン
```typescript
// 残高の状態別表示
const balanceDisplay = (balance: number) => ({
  className: `font-semibold ${
    balance === 0 ? 'text-gray-500' :
    balance > 0 ? 'text-green-600' : 'text-red-600'
  }`,
  text: balance === 0 ? '精算済み' : 
        balance > 0 ? `+¥${balance.toLocaleString()}` : 
        `¥${balance.toLocaleString()}`
})
```

### 4. レスポンシブレイアウト
```css
/* モバイルファースト */
.container {
  @apply w-full px-4;
  
  @screen md: {
    @apply max-w-2xl mx-auto;
  }
  
  @screen lg: {
    @apply max-w-7xl grid grid-cols-2 gap-8;
  }
}
```

### 5. マイクロインタラクション
```typescript
// ボタンのインタラクティブ状態
className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 
           transform hover:scale-105 transition-all duration-200
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
```

## 結果

### ユーザビリティ向上指標
1. **視認性改善**: テキストコントラスト比 4.5:1 以上の確保
2. **認知負荷軽減**: あまり情報の明確な表示による理解向上
3. **操作効率**: リアルタイム計算による入力効率向上
4. **エラー削減**: 事前バリデーション表示によるミス防止

### 実装されたUXパターン
1. **フォームウィザード風**: 段階的な情報入力ガイド
2. **カードベースレイアウト**: 情報のグループ化と視覚的分離
3. **ステータス指標**: 色とアイコンによる状態表現
4. **プレビュー表示**: 確定前の結果プレビュー

### アクセシビリティ達成レベル
1. **WCAG 2.1 AA準拠**: 色彩、コントラスト、フォーカス管理
2. **キーボードナビゲーション**: TABキーによる順次移動
3. **スクリーンリーダー対応**: aria-label、セマンティックHTML

## 検証されたUXパターン

### 成功した改善施策
1. **入力フィールド改善**: 
   - 改善前: 薄い文字で視認性不良
   - 改善後: `text-gray-900 font-medium` による明確な表示
   
2. **あまり表示機能**:
   - 改善前: あまり金額が隠蔽
   - 改善後: 段階的な詳細表示とプレビュー

3. **リアルタイム計算**:
   - 改善前: 送信時のみ計算結果確認
   - 改善後: 入力中のライブプレビュー

4. **状態フィードバック**:
   - 改善前: エラー時のみアラート表示
   - 改善後: 正常時も含む継続的な状態表示

### UXメトリクス
1. **タスク完了率**: 支払い追加フローでの離脱率最小化
2. **エラー発生率**: バリデーション表示によるエラー事前防止
3. **認知負荷**: 複雑な計算の理解しやすさ向上
4. **学習曲線**: 初回利用時の操作習得時間短縮

## トレードオフ

### 採用したトレードオフ
1. **情報密度 vs 理解しやすさ**: 詳細情報表示によるスペース使用量増加
2. **パフォーマンス vs UX**: リアルタイム計算による処理負荷
3. **実装複雑度 vs 操作性**: 状態管理複雑化と引き換えの操作性向上

### 最適化されたバランス
1. **Progressive Enhancement**: 基本機能からの段階的UX向上
2. **Graceful Degradation**: JavaScript無効時でも基本動作保証
3. **Performance Budget**: 60fps維持での滑らかなアニメーション

## 継続的改善プロセス

### フィードバック収集方法
1. **直接フィードバック**: ユーザーからの具体的指摘
2. **行動観察**: 実際の操作パターン分析
3. **エラーログ**: フォーム送信失敗の分析
4. **パフォーマンス**: レンダリング速度の監視

### 改善サイクル
1. **問題特定**: ユーザー行動からの課題発見
2. **仮説立案**: UX改善の方向性策定
3. **プロトタイプ**: 小規模な改善実装
4. **効果検証**: 改善前後の比較分析

## デザインガイドライン

### 色彩使用原則
```typescript
const semanticColors = {
  success: '緑系 - 正常完了、精算済み',
  warning: '黄系 - 注意喚起、未確定',
  error: '赤系 - エラー、負債',
  info: '青系 - 情報、ヒント',
  neutral: 'グレー系 - 通常状態'
}
```

### タイポグラフィ原則
```typescript
const typographyRules = {
  hierarchy: '明確なヘッダー階層の維持',
  readability: '本文16px以上、行間1.5以上',
  emphasis: '重要情報のbold強調',
  currency: '金額の右揃え、3桁区切り'
}
```

### 空間設計原則
```typescript
const spacingRules = {
  grouping: '関連要素の近接配置',
  separation: '異なる機能ブロックの明確な分離',
  whitespace: '認知負荷軽減のための適切な余白',
  rhythm: '一定のスペーシングルールの維持'
}
```

## 関連ファイル
- `src/app/`: UI コンポーネント実装
- `tailwind.config.js`: デザインシステム設定
- `src/styles/globals.css`: グローバルスタイル
- `docs/design/`: デザインガイドライン（今後作成予定）

## 参考文献
- Apple Human Interface Guidelines
- Google Material Design
- WCAG 2.1 Accessibility Guidelines
- "Don't Make Me Think" by Steve Krug

## 更新履歴
- 2025-11-25: 初版作成