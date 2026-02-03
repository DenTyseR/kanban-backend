import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

type BoardResponse = {
  id: string;
  name: string;
  cards: unknown[];
};

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.USE_PG_MEM = 'true';
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates and fetches a board', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/boards')
      .send({ name: 'E2E Board' })
      .expect(201);

    const createBody = createResponse.body as unknown as BoardResponse;
    const boardId = createBody.id;

    const getResponse = await request(app.getHttpServer())
      .get(`/boards/${boardId}`)
      .expect(200);

    const getBody = getResponse.body as unknown as BoardResponse;
    expect(getBody.name).toBe('E2E Board');
    expect(getBody.cards).toHaveLength(0);
  });
});
