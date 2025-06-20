import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Res, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { Response } from 'express';
import { LineService, LineBotConfig } from './line.service';
import { LineBotConfigDto, LineLoginCallbackDto } from './dto/line-bot-config.dto';

@Controller('line')
export class LineController {
  constructor(private readonly lineService: LineService) {}

  // LINE Login開始
  @Get('login')
  initiateLogin(@Res() res: Response) {
    const loginUrl = this.lineService.generateLoginUrl();
    return res.redirect(loginUrl);
  }

  // LINE Login コールバック
  @Get('callback')
  async handleCallback(
    @Query() query: LineLoginCallbackDto,
    @Res() res: Response
  ) {
    try {
      const user = await this.lineService.handleLoginCallback(query.code);
      
      // ユーザー情報をセッションまたはJWTで管理（今回は簡易実装）
      const userSession = encodeURIComponent(JSON.stringify(user));
      
      return res.redirect(`/?user=${userSession}`);
    } catch (error) {
      return res.redirect('/?error=認証に失敗しました');
    }
  }

  // Bot設定テスト
  @Post('test-connection')
  async testConnection(@Body() config: LineBotConfigDto) {
    const isValid = await this.lineService.testBotConnection(config);
    
    return {
      success: isValid,
      message: isValid ? '接続成功！' : '接続に失敗しました。設定を確認してください。'
    };
  }

  // 🆕 Bot設定保存（レスポンス変更）
  @Post('save-config')
  async saveConfig(
    @Body() body: { config: LineBotConfigDto; userId: string }
  ) {
    try {
      const isValid = await this.lineService.testBotConnection(body.config);
      
      if (!isValid) {
        throw new HttpException(
          '設定が正しくありません',
          HttpStatus.BAD_REQUEST
        );
      }

      // Webhook URL付きで保存
      const result = await this.lineService.saveBotConfig(body.userId, body.config);
      
      return result; // { success, webhookUrl, webhookId, message }
    } catch (error) {
      throw new HttpException(
        error.message || '設定の保存に失敗しました',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // 🆕 設定完了画面表示
  @Get('setup-complete')
  setupComplete(@Query('webhookUrl') webhookUrl: string, @Res() res: Response) {
    if (!webhookUrl) {
      return res.redirect('/?error=無効なアクセスです');
    }
    
    return res.redirect(`/setup-complete.html?webhookUrl=${encodeURIComponent(webhookUrl)}`);
  }

  // 設定一覧取得（開発用）
  @Get('configs')
  getAllConfigs(): { configs: LineBotConfig[] } {
    return {
      configs: this.lineService.getAllConfigs()
    };
  }
}
