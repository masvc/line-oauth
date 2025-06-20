# LINE API Multi-Tenant Configuration System

🚀 **マルチテナント対応の LINE Bot 設定システム**

クライアントが簡単に LINE Bot 設定を行える OAuth 認証システムです。技術的な知識がなくても、ブラウザ上で数分で LINE Bot とシステムを連携できます。

## 📋 目次

- [機能概要](#機能概要)
- [技術スタック](#技術スタック)
- [アーキテクチャ](#アーキテクチャ)
- [セットアップ](#セットアップ)
- [使用方法](#使用方法)
- [API 仕様](#api仕様)
- [ディレクトリ構成](#ディレクトリ構成)
- [今後の拡張予定](#今後の拡張予定)

## 🎯 機能概要

### ✅ 実装済み機能

- **LINE Login OAuth 認証**: ユーザーの LINE アカウントでログイン
- **Bot 設定フォーム**: Channel ID、Secret、Access Token の入力・保存
- **接続テスト**: 入力した Bot 情報の妥当性をリアルタイム検証
- **ユニーク Webhook URL 生成**: テナントごとに独立した Webhook URL
- **自動画面遷移**: 設定完了後、Webhook URL 表示画面に自動遷移
- **ワンクリックコピー**: 生成された Webhook URL の簡単コピー機能
- **レスポンシブデザイン**: モバイル・デスクトップ対応

### 🎯 設計思想

- **マルチテナント対応**: 100 社 ×1000 ユーザー規模を想定
- **ユーザーフレンドリー**: 技術知識不要、3 分で設定完了
- **スケーラブル**: テナント別 Webhook URL でレート制限回避
- **セキュア**: 一意の Webhook ID による不正アクセス防止

## 🛠 技術スタック

### Backend

- **NestJS** 11.x - TypeScript Node.js フレームワーク
- **axios** - HTTP クライアント
- **crypto-js** - 暗号化・ユニーク ID 生成
- **class-validator** - バリデーション

### Frontend

- **Pure HTML/CSS/JavaScript** - フレームワーク不使用
- **レスポンシブデザイン** - モバイルファースト
- **Fetch API** - 非同期通信

### External APIs

- **LINE Login API** - OAuth 認証
- **LINE Messaging API** - Bot 機能・接続テスト

## 🏗 アーキテクチャ

### システム構成図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   クライアント    │◄──►│  プラットフォーム   │◄──►│   LINE API      │
│   (企業ユーザー)  │    │   (NestJSアプリ)   │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │ 1. LINE認証             │ 2. OAuth処理           │
         │ 3. Bot設定入力          │ 4. 接続テスト          │
         │ 5. Webhook URL取得      │ 6. Webhook登録         │
```

### フロー図

```
1. LINE認証 → 2. Bot設定 → 3. 保存 → 4. Webhook URL表示 → 5. LINE Developers設定
     ↓             ↓          ↓              ↓                    ↓
  OAuth認証     設定フォーム   接続テスト    一意URL生成          手動設定
```

### マルチテナント設計

```
各テナント独立Webhook URL:
https://platform.com/webhook/line/abc123def456  ← 田中不動産
https://platform.com/webhook/line/xyz789ghi012  ← 佐藤建設
https://platform.com/webhook/line/mno345pqr678  ← 山田商事
```

## 🚀 セットアップ

### 1. 前提条件

- Node.js 18.x 以上
- LINE Developers アカウント
- LINE Login チャンネル作成済み

### 2. プロジェクトセットアップ

```bash
# リポジトリクローン
git clone <repository-url>
cd line_oauth

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
```

### 3. LINE Developers 設定

#### LINE Login チャンネル作成

1. [LINE Developers Console](https://developers.line.biz/console/) にアクセス
2. プロバイダー選択 → 新規チャンネル作成
3. **「LINE Login」** を選択
4. チャンネル情報入力:
   - チャンネル名: `OAuth Test Channel`
   - チャンネル説明: `OAuth認証テスト用`
   - アプリタイプ: `ウェブアプリ`

#### 認証情報取得

1. 作成したチャンネルの「基本設定」
2. **Channel ID** をコピー
3. **Channel Secret** をコピー
4. 「LINE ログイン設定」タブ
5. コールバック URL 設定: `http://localhost:3000/line/callback`

### 4. 環境変数設定

```bash
# .env
LINE_LOGIN_CHANNEL_ID=your_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_channel_secret
LINE_LOGIN_CALLBACK_URL=http://localhost:3000/line/callback
BASE_URL=http://localhost:3000
PORT=3000
```

### 5. サーバー起動

```bash
npm run start:dev
```

🎉 **完了**: `http://localhost:3000` でアクセス可能

## 📱 使用方法

### クライアント側の操作フロー

#### ステップ 1: LINE 認証

1. `http://localhost:3000` にアクセス
2. 「📱 LINE でログイン」ボタンをクリック
3. LINE アカウントでログイン・認可

#### ステップ 2: Bot 設定

1. Messaging API の情報を入力:
   - **Channel ID**: LINE Developers の Messaging API チャンネル ID
   - **Channel Secret**: 基本設定の Channel Secret
   - **Channel Access Token**: Messaging API 設定で発行
2. 「🔍 接続テスト」で設定確認（オプション）
3. 「💾 設定を保存」をクリック

#### ステップ 3: Webhook URL 設定

1. 自動生成された Webhook URL が表示
2. 「📋 コピー」で URL をクリップボードにコピー
3. LINE Developers → Messaging API 設定 → Webhook URL に貼り付け
4. 「検証」ボタンで接続確認
5. 「Webhook の利用」を ON に設定

### 管理者側の機能

#### 設定一覧確認

```bash
curl http://localhost:3000/line/configs
```

#### ログ確認

設定保存時にコンソールに出力:

```
=== LINE Bot Configuration ===
USER_ID=Ue4be2fde44842f4fda793680b214b326
LINE_CHANNEL_ID=2007452778
WEBHOOK_ID=abc123def456
WEBHOOK_URL=http://localhost:3000/webhook/line/abc123def456
================================
```

## 📚 API 仕様

### LINE 認証

- **GET** `/line/login` - LINE 認証開始
- **GET** `/line/callback` - OAuth 認証コールバック

### Bot 設定

- **POST** `/line/test-connection` - 接続テスト
- **POST** `/line/save-config` - 設定保存・Webhook URL 生成

### 管理機能

- **GET** `/line/configs` - 全設定一覧取得

### レスポンス例

```typescript
// POST /line/save-config
{
  "success": true,
  "webhookUrl": "http://localhost:3000/webhook/line/abc123def456",
  "webhookId": "abc123def456",
  "message": "LINE Bot設定が完了しました！"
}

// POST /line/test-connection
{
  "success": true,
  "message": "接続成功！"
}
```

## 📁 ディレクトリ構成

```
line_oauth/
├── src/
│   ├── line/
│   │   ├── dto/
│   │   │   └── line-bot-config.dto.ts      # バリデーション定義
│   │   ├── line.controller.ts              # REST API エンドポイント
│   │   ├── line.service.ts                 # ビジネスロジック
│   │   └── line.module.ts                  # NestJS モジュール
│   ├── app.module.ts                       # アプリケーションモジュール
│   └── main.ts                             # エントリーポイント
├── public/
│   ├── index.html                          # メイン設定画面
│   └── setup-complete.html                 # Webhook URL表示画面
├── .env                                    # 環境変数
├── tsconfig.json                           # TypeScript設定
├── package.json                            # 依存関係
└── README.md                               # このファイル
```

## 🔧 カスタマイズ

### データベース連携

現在はメモリ保存ですが、本番環境では以下に変更:

```typescript
// PostgreSQL例
import { TypeOrmModule } from "@nestjs/typeorm";

@Entity()
export class LineBotConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  webhookId: string;

  // その他のフィールド...
}
```

### 認証強化

```typescript
// JWT実装例
import { JwtModule } from "@nestjs/jwt";

// ユーザーセッション管理
@Injectable()
export class AuthService {
  generateJWT(user: LineUser): string {
    return this.jwtService.sign({ userId: user.userId });
  }
}
```

### 監視・ログ

```typescript
// ログ強化
import { Logger } from "@nestjs/common";

@Injectable()
export class LineService {
  private readonly logger = new Logger(LineService.name);

  async saveBotConfig(userId: string, config: LineBotConfigDto) {
    this.logger.log(`Bot config saved for user: ${userId}`);
    // 実装...
  }
}
```

## 🚨 セキュリティ考慮事項

### 実装済み

- **ユニーク Webhook ID**: 推測困難なランダム文字列
- **HTTPS 推奨**: 本番環境では SSL 必須
- **入力バリデーション**: class-validator による検証

### 推奨追加対策

- **JWT 認証**: ユーザーセッション管理強化
- **レート制限**: API 呼び出し頻度制限
- **監査ログ**: 設定変更履歴の記録
- **暗号化**: データベース保存時の暗号化

## 🔮 今後の拡張予定

### Phase 2: 本格運用対応

- [ ] PostgreSQL/MongoDB 連携
- [ ] JWT 認証システム
- [ ] 管理画面 UI
- [ ] 設定変更履歴
- [ ] バックアップ・復元機能

### Phase 3: エンタープライズ対応

- [ ] マルチリージョン対応
- [ ] 負荷分散
- [ ] 監視・アラート
- [ ] 自動スケーリング
- [ ] 災害復旧

### Phase 4: 機能拡張

- [ ] HubSpot 連携
- [ ] Slack 連携
- [ ] カスタム Webhook
- [ ] 分析・レポート機能

## 📞 サポート

### トラブルシューティング

**Q: 接続テストが失敗する**
A: Channel Access Token が正しいか確認してください。Messaging API 設定で発行されたトークンを使用してください。

**Q: Webhook URL が生成されない**
A: .env の BASE_URL が正しく設定されているか確認してください。

**Q: LINE 認証が失敗する**
A: LINE Login チャンネルのコールバック URL が正しく設定されているか確認してください。

### ログレベル設定

```bash
# 開発環境
LOG_LEVEL=debug

# 本番環境
LOG_LEVEL=error
```

---

## 🎉 まとめ

このシステムにより、技術的な知識がないクライアントでも簡単に LINE Bot とシステムを連携できます。マルチテナント設計により、大規模運用時のパフォーマンス問題も回避できます。

**MVP 版として完成** → **段階的に機能拡張** → **エンタープライズ対応**

の順序で成長させることで、持続可能な SaaS ビジネスの基盤となります。
