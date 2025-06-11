# CLAUDE.md

## 共通コマンド

### 開発コマンド

- ビルド/型チェック: `bun run typecheck`
- コード整形: `bun run format`
- 整形チェック: `bun run format:check`
- テスト実行: `bun test`
- 依存関係インストール: `bun install`

### アクションテスト

- アクションをローカルでテスト: `./test-local.sh`
- 特定ファイルをテスト: `bun test test/prepare-prompt.test.ts`

## アーキテクチャ概要

これはGitHubワークフロー内でClaude Codeを実行するためのGitHub Actionです。以下の要素で構成されています：

### 主要コンポーネント

1. **アクション定義** (`action.yml`): 入力、出力、および複合アクションステップを定義
2. **プロンプト準備** (`src/index.ts`): 指定された引数でClaude Codeを実行

### 主要設計パターン

- 開発と実行にBunランタイムを使用
- プロンプト入力とClaudeプロセス間のIPCに名前付きパイプを使用
- 実行ログのJSON ストリーミング出力形式
- 複数ステップを統合する複合アクションパターン
- Anthropic API、AWS Bedrock、Google Vertex AIをサポートするプロバイダー非依存設計

## プロバイダー認証

1. **OAuth認証**: `use_oauth: true`時にClaude OAuthトークンを使用
   - `claude_access_token`、`claude_refresh_token`、`claude_expires_at`の入力が必要
   - Claude Code認証用に`~/.claude/.credentials.json`ファイルを作成
2. **Anthropic API** (フォールバック): `anthropic_api_key`入力でAPIキーが必要
3. **AWS Bedrock**: `use_bedrock: true`時にOIDC認証を使用
4. **Google Vertex AI**: `use_vertex: true`時にOIDC認証を使用

## テスト戦略

### ローカルテスト

- GitHub Actionsワークフローをローカルで実行するために`act`ツールを使用
- `test-local.sh`スクリプトがローカルテストセットアップを自動化
- `ANTHROPIC_API_KEY`環境変数が必要

### テスト構造

- 設定ロジックの単体テスト
- プロンプト準備の統合テスト
- `.github/workflows/test-action.yml`での完全ワークフローテスト

## 重要な技術詳細

- プロンプト入力用の名前付きパイプ作成に`mkfifo`を使用
- 実行ログを`/tmp/claude-execution-output.json`にJSON形式で出力
- `timeout`コマンドラッパーによるタイムアウト制御
- Bun固有設定での厳密なTypeScript設定

## フォーク状況

これはOAuth認証サポートを追加した[anthropics/claude-code-base-action](https://github.com/anthropics/claude-code-base-action)の独立フォークです。

### アップストリームとの主な違い

- **OAuth認証**: Claude OAuthトークンのサポートを追加（アップストリームはこの機能を削除）
- **セキュリティ強化**: より良いセキュリティのためAPIキーよりOAuthトークンを優先
- **独立メンテナンス**: アップストリームがAPIキー認証に焦点を当てる一方、このフォークはOAuth機能を維持

### アップストリーム同期戦略

- バグ修正と有用な機能についてアップストリームを監視
- 競合しない改善を選択的にマージ
- 主要な差別化要因としてOAuth認証を維持
- OAuth機能を削除する自動マージを回避
