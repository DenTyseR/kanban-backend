import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BoardEntity } from '../entities/board.entity';
import { CardEntity, CardStatus } from '../entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';

@Injectable()
export class CardsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
  ) {}

  async createCard(boardHashId: string, dto: CreateCardDto) {
    const board = await this.boardRepository.findOne({
      where: { id: boardHashId },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const rawStatus: unknown = dto.status;
    const status: CardStatus = this.isCardStatus(rawStatus)
      ? rawStatus
      : CardStatus.TODO;

    const position = await this.cardRepository.count({
      where: { board: { id: board.id }, status },
    });

    const card = this.cardRepository.create({
      ...(process.env.USE_PG_MEM ? { id: randomUUID() } : {}),
      title: dto.title,
      description: dto.description ?? null,
      status,
      board,
      position,
    });

    return this.cardRepository.save(card);
  }

  private isCardStatus(status: unknown): status is CardStatus {
    return Object.values(CardStatus).includes(status as CardStatus);
  }

  async updateCard(cardId: string, dto: UpdateCardDto) {
    return this.dataSource.transaction(async (manager) => {
      const cardRepo = manager.getRepository(CardEntity);

      const card = await cardRepo.findOne({
        where: { id: cardId },
        relations: { board: true },
      });

      if (!card) {
        throw new NotFoundException('Card not found');
      }

      const rawTargetStatus: unknown = dto.status;
      const targetStatus: CardStatus = this.isCardStatus(rawTargetStatus)
        ? rawTargetStatus
        : card.status;

      if (dto.title !== undefined) {
        card.title = dto.title;
      }
      if (dto.description !== undefined) {
        card.description = dto.description ?? null;
      }

      const needsReorder =
        dto.position !== undefined || targetStatus !== card.status;

      if (!needsReorder) {
        return cardRepo.save(card);
      }

      const sourceCards = await cardRepo.find({
        where: { board: { id: card.board.id }, status: card.status },
        order: { position: 'ASC' },
      });

      const sourceFiltered = sourceCards.filter((item) => item.id !== card.id);
      const isSameStatus = targetStatus === card.status;

      const targetCards = isSameStatus
        ? sourceFiltered
        : await cardRepo.find({
            where: { board: { id: card.board.id }, status: targetStatus },
            order: { position: 'ASC' },
          });

      const targetIndex = Math.min(
        Math.max(dto.position ?? targetCards.length, 0),
        targetCards.length,
      );

      card.status = targetStatus;

      const nextTargetCards = [...targetCards];
      nextTargetCards.splice(targetIndex, 0, card);

      nextTargetCards.forEach((item, index) => {
        item.position = index;
      });

      if (!isSameStatus) {
        sourceFiltered.forEach((item, index) => {
          item.position = index;
        });
        await cardRepo.save(sourceFiltered);
      }

      await cardRepo.save(nextTargetCards);
      return cardRepo.findOne({
        where: { id: card.id },
      });
    });
  }

  async deleteCard(cardId: string) {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: { board: true },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    await this.cardRepository.remove(card);

    const remaining = await this.cardRepository.find({
      where: { board: { id: card.board.id }, status: card.status },
      order: { position: 'ASC' },
    });
    remaining.forEach((item, index) => {
      item.position = index;
    });
    await this.cardRepository.save(remaining);

    return { deleted: true };
  }
}
