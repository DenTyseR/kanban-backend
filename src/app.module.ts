import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardsModule } from './boards/boards.module';
import { CardsModule } from './cards/cards.module';
import { BoardEntity } from './entities/board.entity';
import { CardEntity } from './entities/card.entity';
import { ConfigModule } from '@nestjs/config';
import { DataType, newDb } from 'pg-mem';
import { randomUUID } from 'crypto';
import { DataSource, DataSourceOptions } from 'typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [BoardEntity, CardEntity],
        synchronize: true,
      }),
      dataSourceFactory: async (options?: DataSourceOptions) => {
        if (!options) {
          throw new Error('TypeORM options are not defined');
        }

        if (process.env.USE_PG_MEM === 'true') {
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

          const dataSource = (await db.adapters.createTypeormDataSource(
            options,
          )) as unknown as DataSource;
          return dataSource.initialize();
        }

        const dataSource = new DataSource(options);
        return dataSource.initialize();
      },
    }),
    BoardsModule,
    CardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
