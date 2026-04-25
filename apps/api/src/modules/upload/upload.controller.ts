import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadService } from './upload.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import type { RequestWithUser } from '../../common/interfaces/jwt-payload.interface';

@Controller('upload')
@UseGuards(AuthGuard)
export class UploadController {
  constructor(private readonly upload: UploadService) {}

  /**
   * POST /upload/chat-image
   * Accepts multipart/form-data with a single "file" field.
   * Returns { url, key, expiresAt } — pre-signed R2 URL valid for 1 hour.
   */
  @Post('chat-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB guard at Multer level
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported file type: ${file.mimetype}`), false);
        }
      },
    }),
  )
  async uploadChatImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Please send a file in the "file" field.');
    }

    return this.upload.uploadChatImage(file.buffer, file.mimetype, req.user.sub);
  }
}
