import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(@Body() dto: CreateBoardDto) {
    return this.boardsService.createBoard(dto);
  }

  @Get(':hashId')
  getOne(@Param('hashId') hashId: string) {
    return this.boardsService.getBoardByHashId(hashId);
  }

  @Patch(':hashId')
  update(@Param('hashId') hashId: string, @Body() dto: UpdateBoardDto) {
    return this.boardsService.updateBoard(hashId, dto);
  }

  @Delete(':hashId')
  remove(@Param('hashId') hashId: string) {
    return this.boardsService.deleteBoard(hashId);
  }
}
