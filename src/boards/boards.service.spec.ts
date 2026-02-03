import { DataType, newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { BoardEntity } from '../entities/board.entity';
import { CardEntity } from '../entities/card.entity';
import { BoardsService } from './boards.service';

describe('BoardsService', () => {
  let dataSource: DataSource;
  let service: BoardsService;

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
    service = new BoardsService(dataSource.getRepository(BoardEntity));
  });

  afterEach(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('creates a board without cards', async () => {
    const board = await service.createBoard({ name: 'Launch' });

    expect(board.id).toBeDefined();
    expect(board.cards).toHaveLength(0);
  });
});
