import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardEntity } from '../entities/board.entity';
import { CardEntity } from '../entities/card.entity';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';

@Module({
  imports: [TypeOrmModule.forFeature([BoardEntity, CardEntity])],
  controllers: [CardsController],
  providers: [CardsService],
})
export class CardsModule {}
