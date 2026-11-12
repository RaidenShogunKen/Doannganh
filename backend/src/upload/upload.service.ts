import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { VaiTro } from '../common/enums';

export interface UploadedFileResponse {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  uploadedAt: string;
}

export const uploadDirectory = path.resolve(process.env.UPLOAD_DIR || 'uploads');
const fileRoute = '/api/v1/upload/files/';
const fileNamePattern = /^[\w-]+\.(pdf|png|jpe?g|docx?|xlsx|txt)$/i;
const mimeTypes: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain; charset=utf-8',
};

@Injectable()
export class UploadService {
  constructor(private readonly dataSource: DataSource) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
  }

  async register(files: Express.Multer.File[], ownerId: string): Promise<UploadedFileResponse[]> {
    if (!files.length) throw new BadRequestException('Chưa chọn tệp để tải lên');
    try {
      await this.dataSource.transaction(async (manager) => {
        for (const file of files) {
          if (!file.size) throw new BadRequestException('Tệp tải lên không có nội dung');
          await manager.query('INSERT INTO tep_tin_hoc_vu (ten_tep, ma_chu_so_huu) VALUES ($1, $2)', [
            file.filename, ownerId,
          ]);
        }
      });
    } catch (error) {
      await Promise.allSettled(files.map((file) => fs.promises.unlink(file.path)));
      throw error;
    }
    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: this.getFileMimeType(file.filename),
      size: file.size,
      url: fileRoute + file.filename,
      uploadedAt: new Date().toISOString(),
    }));
  }

  async requireOwnedFile(url: string | undefined, ownerId: string, manager = this.dataSource.manager) {
    if (!url) return;
    const filename = url.slice(fileRoute.length);
    if (!url.startsWith(fileRoute) || !fileNamePattern.test(filename)) {
      throw new BadRequestException('Vui lòng tải minh chứng lên hệ thống');
    }
    const [row] = await manager.query('SELECT ma_chu_so_huu FROM tep_tin_hoc_vu WHERE ten_tep = $1', [filename]);
    if (row?.ma_chu_so_huu !== ownerId) throw new ForbiddenException('Bạn không có quyền đính kèm tệp này');
    this.getFilePath(filename);
  }

  async sha256(url: string): Promise<string> {
    if (!url.startsWith(fileRoute)) throw new BadRequestException('Đường dẫn tệp không hợp lệ');
    const hash = createHash('sha256');
    for await (const chunk of fs.createReadStream(this.getFilePath(url.slice(fileRoute.length)))) hash.update(chunk);
    return hash.digest('hex');
  }

  async canReadFile(filename: string, user: { maNd: string; vaiTro: VaiTro }): Promise<boolean> {
    if (!fileNamePattern.test(filename)) return false;
    if (user.vaiTro === VaiTro.Admin) return true;
    const [row] = await this.dataSource.query(`
      SELECT EXISTS (
        SELECT 1 FROM tep_tin_hoc_vu WHERE ten_tep = $1 AND ma_chu_so_huu = $2
        UNION ALL
        SELECT 1 FROM de_tai dt
        WHERE $2 IN (dt.ma_hv, dt.ma_gvhd, dt.ma_gvhd2)
          AND (
            dt.file_de_cuong = $3
            OR EXISTS (SELECT 1 FROM tien_do td WHERE td.ma_dt = dt.ma_dt AND td.file_bao_cao_url = $3)
            OR EXISTS (SELECT 1 FROM bai_bao_khoa_hoc bb WHERE bb.ma_hv = dt.ma_hv AND bb.file_minh_chung = $3)
            OR EXISTS (SELECT 1 FROM minh_chung_bao_ve mc WHERE mc.ma_dt = dt.ma_dt AND mc.file_url = $3 AND mc.loai <> 'PhanBien')
          )
        UNION ALL
        SELECT 1 FROM don_tuyen_sinh ts WHERE ts.ma_nd = $2
          AND $3 IN (ts.bang_tot_nghiep_url, ts.bang_tieng_anh_url, ts.ly_lich_khoa_hoc_url, ts.file_quyet_dinh_url)
        UNION ALL
        SELECT 1 FROM hoc_vien hv WHERE hv.ma_hv = $2 AND hv.file_quyet_dinh_tot_nghiep = $3
        UNION ALL
        SELECT 1 FROM don_hoc_vu don LEFT JOIN de_tai dt ON dt.ma_dt = don.ma_dt
        WHERE don.file_dinh_kem_url = $3 AND $2 IN (don.ma_hv, dt.ma_gvhd, dt.ma_gvhd2)
        UNION ALL
        SELECT 1 FROM hoi_dong hd JOIN de_tai dt ON dt.ma_dt = hd.ma_dt
        WHERE hd.bien_ban_url = $3 AND (
          $2 IN (dt.ma_hv, dt.ma_gvhd, dt.ma_gvhd2)
          OR EXISTS (SELECT 1 FROM thanhvien_hoidong tv WHERE tv.ma_hd = hd.ma_hd AND tv.ma_gv = $2)
        )
      ) AND NOT EXISTS (
        SELECT 1 FROM minh_chung_bao_ve WHERE file_url = $3 AND loai = 'PhanBien'
      ) AS allowed
    `, [filename, user.maNd, fileRoute + filename]);
    return row?.allowed === true;
  }

  getFilePath(filename: string): string {
    if (!fileNamePattern.test(filename)) throw new NotFoundException('Không tìm thấy tệp tin');
    const filePath = path.join(uploadDirectory, filename);
    if (!fs.statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
      throw new NotFoundException('Không tìm thấy tệp tin');
    }
    return filePath;
  }

  getFileMimeType(filename: string): string {
    return mimeTypes[path.extname(filename).toLowerCase()] ?? 'application/octet-stream';
  }
}
