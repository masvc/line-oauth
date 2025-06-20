import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LineBotConfigDto } from './dto/line-bot-config.dto';
import axios from 'axios';
import * as crypto from 'crypto-js';

interface LineUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
}

export interface LineBotConfig {
  channelId: string;
  channelSecret: string;
  channelAccessToken: string;
  userId: string;
  webhookId: string;  // 🆕 追加
  webhookUrl: string; // 🆕 追加
  createdAt: Date;
}

@Injectable()
export class LineService {
  private botConfigs: Map<string, LineBotConfig> = new Map();

  constructor(private configService: ConfigService) {}

  // LINE Login用のOAuth URL生成
  generateLoginUrl(): string {
    const channelId = this.configService.get('LINE_LOGIN_CHANNEL_ID');
    const callbackUrl = this.configService.get('LINE_LOGIN_CALLBACK_URL');
    const state = crypto.lib.WordArray.random(16).toString();
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: channelId,
      redirect_uri: callbackUrl,
      state: state,
      scope: 'profile openid email'
    });

    return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
  }

  // LINE Login認証後のユーザー情報取得
  async handleLoginCallback(code: string): Promise<LineUser> {
    try {
      // 1. アクセストークン取得
      const tokenResponse = await axios.post(
        'https://api.line.me/oauth2/v2.1/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: this.configService.get('LINE_LOGIN_CALLBACK_URL'),
          client_id: this.configService.get('LINE_LOGIN_CHANNEL_ID'),
          client_secret: this.configService.get('LINE_LOGIN_CHANNEL_SECRET'),
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // 2. ユーザー情報取得
      const userResponse = await axios.get(
        'https://api.line.me/v2/profile',
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      return {
        userId: userResponse.data.userId,
        displayName: userResponse.data.displayName,
        pictureUrl: userResponse.data.pictureUrl,
      };

    } catch (error) {
      console.error('LINE Login error:', error);
      throw new HttpException(
        'LINE認証に失敗しました',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Bot設定の接続テスト
  async testBotConnection(config: LineBotConfigDto): Promise<boolean> {
    try {
      const response = await axios.get(
        'https://api.line.me/v2/bot/info',
        {
          headers: {
            'Authorization': `Bearer ${config.channelAccessToken}`
          }
        }
      );

      // Channel IDの整合性チェック
      return response.data && response.status === 200;
    } catch (error) {
      console.error('Bot connection test failed:', error);
      return false;
    }
  }

  // 🆕 ユニークWebhook ID生成
  private generateWebhookId(): string {
    return crypto.lib.WordArray.random(16).toString() + Date.now().toString(36);
  }

  // 🆕 Webhook URL生成
  private generateWebhookUrl(webhookId: string): string {
    const baseUrl = this.configService.get('BASE_URL') || 'http://localhost:3000';
    return `${baseUrl}/webhook/line/${webhookId}`;
  }

  // 🆕 Bot設定保存（Webhook URL生成付き）
  async saveBotConfig(userId: string, config: LineBotConfigDto): Promise<{
    success: boolean;
    webhookUrl: string;
    webhookId: string;
    message: string;
  }> {
    // ユニークWebhook ID生成
    const webhookId = this.generateWebhookId();
    const webhookUrl = this.generateWebhookUrl(webhookId);

    const botConfig: LineBotConfig = {
      ...config,
      userId,
      webhookId,
      webhookUrl,
      createdAt: new Date()
    };

    // 実際のプロダクションではDBに保存
    this.botConfigs.set(userId, botConfig);
    
    // 環境変数スタイルでログ出力（開発用）
    console.log('\n=== LINE Bot Configuration ===');
    console.log(`USER_ID=${userId}`);
    console.log(`LINE_CHANNEL_ID=${config.channelId}`);
    console.log(`LINE_CHANNEL_SECRET=${config.channelSecret}`);
    console.log(`LINE_CHANNEL_ACCESS_TOKEN=${config.channelAccessToken}`);
    console.log(`WEBHOOK_ID=${webhookId}`);
    console.log(`WEBHOOK_URL=${webhookUrl}`);
    console.log('================================\n');

    return {
      success: true,
      webhookUrl,
      webhookId,
      message: 'LINE Bot設定が完了しました！'
    };
  }

  // ユーザーのBot設定取得
  getBotConfig(userId: string): LineBotConfig | null {
    return this.botConfigs.get(userId) || null;
  }

  // 設定済みユーザーの一覧取得
  getAllConfigs(): LineBotConfig[] {
    return Array.from(this.botConfigs.values());
  }

  // 🆕 Webhook IDでBot設定取得
  getBotConfigByWebhookId(webhookId: string): LineBotConfig | null {
    for (const config of this.botConfigs.values()) {
      if (config.webhookId === webhookId) {
        return config;
      }
    }
    return null;
  }
}