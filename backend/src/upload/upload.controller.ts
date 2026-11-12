import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, Options } from 'multer';
import { Response } from 'express';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaiTro } from '../common/enums';
import { UploadService, uploadDirectory } from './upload.service';

const uploadOptions: Options = {
  storage: diskStorage({
    destination: uploadDirectory,
    filename: (_req, file, callback) =>
      callback(null, randomUUID() + extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!/\.(pdf|png|jpe?g|docx?|xlsx|txt)$/i.test(file.originalname)) {
      callback(new BadRequestException('Định dạng tệp không được hỗ trợ'));
      return;
    }
    callback(null, true);
  },
};

@ApiTags('upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @Post('single')
  @UseInterceptors(FileInterceptor('file', uploadOptions))
  async uploadSingle(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: { maNd: string }) {
    const [result] = await this.uploadService.register(file ? [file] : [], user.maNd);
    return result;
  }

  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 5, uploadOptions))
  uploadMultiple(@UploadedFiles() files: Express.Multer.File[], @CurrentUser() user: { maNd: string }) {
    return this.uploadService.register(files || [], user.maNd);
  }

  @Get('files/:filename')
  async serveFile(
    @Param('filename') filename: string,
    @CurrentUser() user: { maNd: string; vaiTro: VaiTro },
    @Res() res: Response,
  ) {
    if (!await this.uploadService.canReadFile(filename, user)) {
      throw new NotFoundException('Không tìm thấy tệp tin');
    }
    const filePath = this.uploadService.getFilePath(filename);
    const mimeType = this.uploadService.getFileMimeType(filename);
    const disposition = /^(image\/|application\/pdf$|text\/plain)/.test(mimeType) ? 'inline' : 'attachment';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    await pipeline(createReadStream(filePath), res).catch((error) => res.destroy(error));
  }
}
