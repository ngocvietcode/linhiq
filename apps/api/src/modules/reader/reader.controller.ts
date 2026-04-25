import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { ReaderService } from './reader.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import {
  createBookmarkSchema,
  upsertNoteSchema,
  updateNoteSchema,
} from '@linhiq/validators';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('reader')
@UseGuards(AuthGuard)
export class ReaderController {
  constructor(private readonly reader: ReaderService) {}

  // ── Bookmarks ─────────────────────────────

  @Get('bookmarks')
  async listBookmarks(
    @Query('bookVolumeId') bookVolumeId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!bookVolumeId) throw new BadRequestException('bookVolumeId required');
    return this.reader.listBookmarks(req.user.sub, bookVolumeId);
  }

  @Post('bookmarks')
  async createBookmark(@Body() body: unknown, @Req() req: RequestWithUser) {
    const input = createBookmarkSchema.parse(body);
    return this.reader.createBookmark(
      req.user.sub,
      input.bookVolumeId,
      input.pageNumber,
      input.label,
    );
  }

  @Delete('bookmarks/:id')
  async deleteBookmark(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.reader.deleteBookmark(req.user.sub, id);
  }

  @Delete('bookmarks')
  async deleteBookmarkByPage(
    @Query('bookVolumeId') bookVolumeId: string,
    @Query('pageNumber', ParseIntPipe) pageNumber: number,
    @Req() req: RequestWithUser,
  ) {
    if (!bookVolumeId) throw new BadRequestException('bookVolumeId required');
    return this.reader.deleteBookmarkByPage(
      req.user.sub,
      bookVolumeId,
      pageNumber,
    );
  }

  // ── Notes ─────────────────────────────────

  @Get('notes')
  async listNotes(
    @Query('bookVolumeId') bookVolumeId: string,
    @Req() req: RequestWithUser,
  ) {
    if (!bookVolumeId) throw new BadRequestException('bookVolumeId required');
    return this.reader.listNotes(req.user.sub, bookVolumeId);
  }

  @Post('notes')
  async upsertNote(@Body() body: unknown, @Req() req: RequestWithUser) {
    const input = upsertNoteSchema.parse(body);
    return this.reader.upsertNote(
      req.user.sub,
      input.bookVolumeId,
      input.pageNumber,
      input.content,
    );
  }

  @Put('notes/:id')
  async updateNote(
    @Param('id') id: string,
    @Body() body: unknown,
    @Req() req: RequestWithUser,
  ) {
    const input = updateNoteSchema.parse(body);
    return this.reader.updateNote(req.user.sub, id, input.content);
  }

  @Delete('notes/:id')
  async deleteNote(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.reader.deleteNote(req.user.sub, id);
  }
}
