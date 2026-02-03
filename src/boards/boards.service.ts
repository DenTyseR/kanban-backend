import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardEntity } from '../entities/board.entity';
import { CardStatus } from '../entities/card.entity';

const STATUS_ORDER: Record<CardStatus, number> = {
  [CardStatus.TODO]: 0,
  [CardStatus.IN_PROGRESS]: 1,
  [CardStatus.DONE]: 2,
};

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
  ) {}

  async createBoard(dto: CreateBoardDto) {
    const board = this.boardRepository.create({
      name: dto.name,
    });

    const saved = await this.boardRepository.save(board);
    return this.getBoardByHashId(saved.id);
  }

  async getBoardByHashId(id: string) {
    const board = await this.boardRepository.findOne({
      where: { id },
      relations: {
        cards: true,
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    board.cards.sort((a, b) => {
      const statusDiff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return a.position - b.position;
    });

    return board;
  }

  async updateBoard(id: string, dto: UpdateBoardDto) {
    const board = await this.boardRepository.findOne({ where: { id } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }

    if (dto.name) {
      board.name = dto.name;
    }

    await this.boardRepository.save(board);
    return this.getBoardByHashId(id);
  }

  async deleteBoard(id: string) {
    const board = await this.boardRepository.findOne({ where: { id } });
    if (!board) {
      throw new NotFoundException('Board not found');
    }
    await this.boardRepository.remove(board);
    return { deleted: true };
  }
}
