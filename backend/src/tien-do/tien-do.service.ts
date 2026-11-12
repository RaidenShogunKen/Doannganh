import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TienDo } from './entities/tien-do.entity';
import { DeTai } from '../de-tai/entities/de-tai.entity';
import { CreateTienDoDto, NhanXetTienDoDto } from './dto';
import { TrangThaiDeTai, TrangThaiHocVien, VaiTro } from '../common/enums';
import { UploadService } from '../upload/upload.service';
import { HocVien } from '../users/entities/hoc-vien.entity';

const reportStatuses = [TrangThaiDeTai.DaDuyet, TrangThaiDeTai.DangThucHien, TrangThaiDeTai.KhongDat];

@Injectable()
export class TienDoService {
  constructor(
    @InjectRepository(TienDo)
    private readonly tienDoRepo: Repository<TienDo>,
    @InjectRepository(DeTai)
    private readonly deTaiRepo: Repository<DeTai>,
    private readonly uploads: UploadService,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: string, dto: CreateTienDoDto): Promise<TienDo> {
    const content = dto.noiDung.trim();
    if (!content) throw new BadRequestException('Nội dung báo cáo tiến độ không được để trống');

    return this.dataSource.transaction(async (manager) => {
      const topic = await manager.findOne(DeTai, { where: { maDt: dto.maDt }, lock: { mode: 'pessimistic_write' } });
      if (!topic) throw new NotFoundException('Không tìm thấy đề tài');
      if (topic.maHv !== userId) throw new ForbiddenException('Chỉ chủ sở hữu đề tài mới được nộp báo cáo tiến độ');

      const learner = await manager.findOneBy(HocVien, { maHv: userId });
      if (!reportStatuses.includes(topic.trangThai) || learner?.trangThai !== TrangThaiHocVien.DangHoc) {
        throw new BadRequestException('Chỉ nhận báo cáo khi học viên đang học và đề tài đang thực hiện');
      }

      await this.uploads.requireOwnedFile(dto.fileBaoCaoUrl, userId, manager);
      const repo = manager.getRepository(TienDo);
      const last = await repo.createQueryBuilder('td')
        .select('MAX(td.lanBaoCao)', 'max')
        .where('td.maDt = :maDt', { maDt: dto.maDt })
        .getRawOne<{ max: number | null }>();
      return repo.save(repo.create({
        maDt: dto.maDt, lanBaoCao: Number(last?.max ?? 0) + 1, noiDung: content, fileBaoCaoUrl: dto.fileBaoCaoUrl,
      }));
    });
  }

  async listByDeTai(maDt: string, user: any): Promise<TienDo[]> {
    const dt = await this.deTaiRepo.findOne({ where: { maDt } });
    if (!dt) {
      throw new NotFoundException('Không tìm thấy đề tài');
    }

    if (
      (user.vaiTro === VaiTro.HocVien && dt.maHv !== user.maNd) ||
      (user.vaiTro === VaiTro.GiangVien && dt.maGvhd !== user.maNd && dt.maGvhd2 !== user.maNd)
    ) {
      throw new ForbiddenException('Bạn không có quyền xem tiến độ đề tài này');
    }

    return this.tienDoRepo.find({
      where: { maDt },
      order: { lanBaoCao: 'ASC' },
    });
  }

  async nhanXet(maTd: string, dto: NhanXetTienDoDto, user: { vaiTro: VaiTro; maNd: string }): Promise<TienDo> {
    const note = dto.nhanXetGvhd.trim();
    if (!note) throw new BadRequestException('Nhận xét không được để trống');

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(TienDo);
      const report = await repo.findOne({ where: { maTd } });
      if (!report) throw new NotFoundException('Không tìm thấy báo cáo tiến độ');

      const topic = await manager.findOne(DeTai, { where: { maDt: report.maDt }, lock: { mode: 'pessimistic_write' } });
      if (!topic) throw new NotFoundException('Không tìm thấy đề tài');
      if (user.vaiTro !== VaiTro.Admin
        && (user.vaiTro !== VaiTro.GiangVien || ![topic.maGvhd, topic.maGvhd2].includes(user.maNd))) {
        throw new ForbiddenException('Chỉ GVHD hoặc Quản trị viên mới được nhận xét tiến độ');
      }
      if (!reportStatuses.includes(topic.trangThai)) {
        throw new BadRequestException('Hồ sơ đã chuyển bước, không thể sửa điểm và nhận xét tiến độ');
      }

      await repo.update({ maTd }, { nhanXetGvhd: note, diemSo: dto.diemSo, danhGiaKq: dto.danhGiaKq });
      return repo.findOneByOrFail({ maTd });
    });
  }
}
