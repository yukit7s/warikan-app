# 割り勘アプリ（Warikan App）

グループでの割り勘計算を簡単に行えるWebアプリケーションです。Test-Driven Development (TDD) によって開発され、高品質で拡張性のあるアーキテクチャを採用しています。

## 主な機能

### ✨ 基本機能
- **グループ管理**: メンバーの追加・削除・編集
- **支払い記録**: 金額、内容、支払者の記録
- **柔軟な分担設定**: 支払いごとの参加者選択
- **精算計算**: 最適な精算取引の自動算出
- **リアルタイム計算**: 入力に応じた即座の結果表示

### 🧮 分担方式
- **支払いごと分担**: 各支払いで参加者を個別に選択
- **均等割り**: 選択されたメンバー間での自動均等分割
- **個別指定**: メンバーごとの負担額手動設定
- **あまり処理**: 割り切れない金額の適切な分配

### 💾 データ管理
- **ローカル保存**: LocalStorageによるオフライン対応
- **完全CRUD**: 作成・読み取り・更新・削除操作
- **データ整合性**: 型安全性による実行時エラー防止

## 技術スタック

- **フロントエンド**: React 18 + TypeScript + Next.js 14
- **スタイリング**: Tailwind CSS
- **テスト**: Jest + Testing Library
- **データ永続化**: LocalStorage
- **開発手法**: Test-Driven Development (TDD)

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd warikan-app

# 依存関係のインストール
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセスできます。

### テストの実行

```bash
# 全テストの実行
npm test

# テストのwatch mode
npm run test:watch

# テストカバレッジの確認
npm run test:coverage
```

## プロジェクト構造

```
src/
├── app/                      # Next.js App Router
│   ├── groups/               # グループ関連のページ
│   └── page.tsx              # ホームページ
├── lib/                      # ビジネスロジック
│   ├── group-manager.ts      # グループ管理
│   ├── payment-manager.ts    # 支払い管理
│   ├── settlement-manager.ts # 精算管理
│   ├── settlement.ts         # 精算計算エンジン
│   └── __tests__/            # テストファイル
├── types/                    # TypeScript型定義
└── __tests__/                # 統合テスト
```

## アーキテクチャ

### Manager パターン
ビジネスロジックをManager クラスに集約し、UI層との分離を実現：

- `GroupManager`: グループとメンバーの管理
- `PaymentManager`: 支払い情報の管理
- `SettlementManager`: 精算履歴の管理

### 計算エンジン
複数の分担方式に対応した柔軟な設計：

- `calculateSettlement`: 支払いごと分担方式
- `calculateTotalSettlement`: 総額割り勘方式

## テスト戦略

### TDD実装
- **Red-Green-Refactor**: テストファースト開発
- **52のテストケース**: 包括的なカバレッジ
- **階層化テスト**: 単体・統合・UIテスト

### テストカバレッジ
- Manager クラス: 100%
- 計算ロジック: 100%
- UI コンポーネント: 90%以上

```bash
# 主要テストカテゴリ
src/lib/__tests__/                    # 単体テスト
src/lib/__tests__/participant-selection.test.ts  # 統合テスト
src/__tests__/integration/            # UIテスト
```

## 開発ガイドライン

### コーディング規約
- TypeScript strict mode
- ESLint + Prettier
- セマンティックHTML
- アクセシビリティ対応 (WCAG 2.1 AA)

### Git ワークフロー
- 機能ブランチによる開発
- コミット前のテスト実行必須
- 型安全性チェック

### パフォーマンス
- Next.js 最適化機能の活用
- 適切なコード分割
- 画像・フォント最適化

## ドキュメント

詳細な設計決定については、[Architecture Decision Records (ADR)](./docs/adr/) を参照してください：

- [ADR-001: プロジェクトアーキテクチャと開発手法](./docs/adr/001-project-architecture-and-development-methodology.md)
- [ADR-002: 分担方式の設計決定](./docs/adr/002-split-method-design.md)
- [ADR-003: テスト戦略とTDD実装](./docs/adr/003-testing-strategy.md)
- [ADR-004: データ永続化戦略](./docs/adr/004-data-persistence-strategy.md)
- [ADR-005: UI/UX設計決定](./docs/adr/005-ui-ux-design-decisions.md)

## 使い方

### 1. グループ作成
1. ホームページで「新しいグループを作成」をクリック
2. グループ名とメンバー名を入力
3. 「グループを作成」で完了

### 2. 支払い追加
1. グループ詳細ページで「支払いを追加」をクリック
2. 金額、内容、支払者を入力
3. 参加者を選択（均等割りまたは個別指定）
4. 「支払いを追加」で記録

### 3. 精算確認
- グループ詳細ページで各メンバーの残高を確認
- 「必要な精算」セクションで最適な精算方法を確認

## 今後の拡張予定

- [ ] データのクラウド同期
- [ ] グループ招待機能
- [ ] 支払い画像の添付
- [ ] 精算履歴のエクスポート
- [ ] PWA対応

## ライセンス

MIT License

## 貢献

プルリクエストや Issue の報告を歓迎します。開発に参加する場合は、事前に既存のテストを実行し、新機能には適切なテストを追加してください。

## サポート

問題や質問がある場合は、GitHub の Issue を作成してください。

---

💡 このプロジェクトは TDD (Test-Driven Development) の実践例として開発されました。品質重視の開発プロセスを体験できます。