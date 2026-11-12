import { BadRequestException, ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaiBaoKhoaHoc } from './entities/bai-bao-khoa-hoc.entity';
import { CreateBaiBaoDto } from './dto';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { TrangThaiHocVien, VaiTro } from '../common/enums';
import { UploadService } from '../upload/upload.service';
import { HocVien } from '../users/entities/hoc-vien.entity';

@Injectable()
export class BaiBaoService {
  constructor(
    @InjectRepository(BaiBaoKhoaHoc)
    private readonly baiBaoRepo: Repository<BaiBaoKhoaHoc>,
    @InjectRepository(DeTai)
    private readonly deTaiRepo: Repository<DeTai>,
    private readonly uploads: UploadService,
    private readonly dataSource: DataSource,
  ) {}

  async create(maHv: string, dto: CreateBaiBaoDto): Promise<BaiBaoKhoaHoc> {
    const title = dto.tieuDe.normalize('NFC').trim().replace(/\s+/g, ' ');
    const doi = dto.doi?.trim().replace(/^(?:https?:\/\/(?:dx\.)?doi\.org\/|doi:\s*)/i, '').toLowerCase() || undefined;
    if (!title) throw new BadRequestException('Tiêu đề bài báo không được để trống');
    if (doi && !/^10\.\d{4,}(?:\.\d+)*\/\S+$/i.test(doi)) throw new BadRequestException('Mã DOI không đúng định dạng');
    return this.dataSource.transaction(async (manager) => {
      const learner = await manager.findOne(HocVien, { where: { maHv }, lock: { mode: 'pessimistic_write' } });
      if (learner?.trangThai !== TrangThaiHocVien.DangHoc) {
        throw new BadRequestException('Chỉ học viên đang học mới được khai báo công bố');
      }
      await this.uploads.requireOwnedFile(dto.fileMinhChung, maHv, manager);
      const repo = manager.getRepository(BaiBaoKhoaHoc);
      const duplicate = repo.createQueryBuilder('bb').where('bb.maHv = :maHv', { maHv });
      const sameTitle = 'LOWER(BTRIM(bb.tieuDe)) = LOWER(:title)';
      if (doi) {
        const storedDoi = "LOWER(REGEXP_REPLACE(BTRIM(bb.doi), '^(https?://(dx[.])?doi[.]org/|doi:[[:space:]]*)', '', 'i'))";
        duplicate.andWhere(`(${storedDoi} = :doi OR (NULLIF(BTRIM(bb.doi), '') IS NULL AND ${sameTitle}))`, { doi, title });
      } else {
        duplicate.andWhere(sameTitle, { title });
      }
      if (await duplicate.getExists()) throw new ConflictException('Công bố này đã có trong hồ sơ học viên');
      return repo.save(repo.create({
        ...dto, maHv, tieuDe: title, doi, issn: dto.issn?.trim() || undefined,
        vaiTroTacGia: dto.vaiTroTacGia?.trim() || undefined,
        tenTapChiHoiThao: dto.tenTapChiHoiThao?.trim() || undefined,
      }));
    });
  }

  async listByHocVien(maHv: string, user: { maNd: string; vaiTro: VaiTro }): Promise<BaiBaoKhoaHoc[]> {
    if (user.vaiTro === VaiTro.GiangVien && !await this.deTaiRepo.exists({
      where: [{ maHv, maGvhd: user.maNd }, { maHv, maGvhd2: user.maNd }],
    })) {
      throw new ForbiddenException('Bạn chỉ được xem công bố của học viên mình hướng dẫn');
    }
    return this.baiBaoRepo.find({
      where: { maHv },
      order: { ngayCongBo: 'DESC' },
    });
  }

}
