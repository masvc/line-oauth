import { Module } from '@nestjs/common';
import { LineController } from './line.controller';
import { LineService } from './line.service';

@Module({
  controllers: [LineController],
  providers: [LineService],
  exports: [LineService],
})
export class LineModule {}
