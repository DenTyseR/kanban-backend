import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Controller()
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('boards/:hashId/cards')
  create(@Param('hashId') hashId: string, @Body() dto: CreateCardDto) {
    return this.cardsService.createCard(hashId, dto);
  }

  @Patch('cards/:id')
  update(@Param('id') id: string, @Body() dto: UpdateCardDto) {
    return this.cardsService.updateCard(id, dto);
  }

  @Delete('cards/:id')
  remove(@Param('id') id: string) {
    return this.cardsService.deleteCard(id);
  }
}
