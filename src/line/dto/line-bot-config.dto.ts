import { IsString, IsNotEmpty } from 'class-validator';

export class LineBotConfigDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @IsString()
  @IsNotEmpty()
  channelSecret: string;

  @IsString()
  @IsNotEmpty()
  channelAccessToken: string;
}

export class LineLoginCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  state?: string;
}
