import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { TextbookService } from './textbook.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('textbooks')
@UseGuards(AuthGuard)
export class TextbookController {
  constructor(private readonly textbook: TextbookService) {}

  /**
   * GET /textbooks?subjectId=xxx
   * List all book volumes for a subject
   */
  @Get()
  async getBooks(@Query('subjectId') subjectId: string) {
    return this.textbook.getBooksForSubject(subjectId);
  }

  /**
   * GET /textbooks/:bookVolumeId/toc
   * Get table of contents (chapter/topic list with start pages)
   */
  @Get(':bookVolumeId/toc')
  async getTableOfContents(@Param('bookVolumeId') bookVolumeId: string) {
    return this.textbook.getTableOfContents(bookVolumeId);
  }

  /**
   * GET /textbooks/:bookVolumeId/pages/:page/context
   * Get topic/chapter metadata for a given page number
   */
  @Get(':bookVolumeId/pages/:page/context')
  async getPageContext(
    @Param('bookVolumeId') bookVolumeId: string,
    @Param('page', ParseIntPipe) page: number,
  ) {
    return this.textbook.getPageContext(bookVolumeId, page);
  }

  /**
   * GET /textbooks/:bookVolumeId/pages/:page/img
   * Stream page WebP image — auth required, no direct file URL exposed
   * Headers: Cache-Control: private (prevents public caching)
   */
  @Get(':bookVolumeId/pages/:page/img')
  async getPageImage(
    @Param('bookVolumeId') bookVolumeId: string,
    @Param('page', ParseIntPipe) page: number,
    @Res() res: Response,
  ) {
    const imagePath = await this.textbook.getPageImagePath(bookVolumeId, page);

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    // No Content-Disposition: attachment — prevents download

    const fs = await import('fs');
    const stream = fs.createReadStream(imagePath);
    stream.pipe(res);
  }
}
