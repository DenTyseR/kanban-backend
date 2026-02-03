import { DataType, newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { BoardsService } from '../boards/boards.service';
import { BoardEntity } from '../entities/board.entity';
import { CardEntity, CardStatus } from '../entities/card.entity';
import { CardsService } from './cards.service';

describe('CardsService', () => {
  let dataSource: DataSource;
  let boardsService: BoardsService;
  let cardsService: CardsService;

  beforeEach(async () => {
    process.env.USE_PG_MEM = 'true';
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
      name: 'version',
      returns: DataType.text,
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'current_database',
      returns: DataType.text,
      implementation: () => 'pg-mem',
    });
    db.public.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => randomUUID(),
    });
    dataSource = (await db.adapters.createTypeormDataSource({
      type: 'postgres',
      entities: [BoardEntity, CardEntity],
      synchronize: true,
    })) as unknown as DataSource;
    await dataSource.initialize();

    boardsService = new BoardsService(dataSource.getRepository(BoardEntity));
    cardsService = new CardsService(
      dataSource,
      dataSource.getRepository(BoardEntity),
      dataSource.getRepository(CardEntity),
    );
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('moves a card to another status and reorders positions', async () => {
    const board = await boardsService.createBoard({ name: 'Flow' });

    const first = await cardsService.createCard(board.id, {
      title: 'First',
      status: CardStatus.TODO,
    });
    await cardsService.createCard(board.id, {
      title: 'Second',
      status: CardStatus.TODO,
    });

    const updated = await cardsService.updateCard(first.id, {
      status: CardStatus.DONE,
      position: 0,
    });

    expect(updated?.status).toBe(CardStatus.DONE);

    const remaining = await dataSource.getRepository(CardEntity).find({
      where: { board: { id: board.id }, status: CardStatus.TODO },
      order: { position: 'ASC' },
    });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].position).toBe(0);
  });
});
