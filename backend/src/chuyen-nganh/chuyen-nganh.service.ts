import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChuyenNganh } from '../users/entities/chuyen-nganh.entity';
import { CreateChuyenNganhDto } from './dto/create-chuyen-nganh.dto';

@Injectable()
export class ChuyenNganhService {
  constructor(
    @InjectRepository(ChuyenNganh)
    private readonly chuyenNganhRepo: Repository<ChuyenNganh>,
  ) {}

  async findAll(): Promise<ChuyenNganh[]> {
    return this.chuyenNganhRepo.find({ order: { tenCn: 'ASC' } });
  }

  async create(dto: CreateChuyenNganhDto): Promise<ChuyenNganh> {
    const cn = this.chuyenNganhRepo.create(dto);
    return this.chuyenNganhRepo.save(cn);
  }

  async cauHinhHocPhan(maCn: number, soTinChiHocPhan: number) {
    const result = await this.chuyenNganhRepo.update({ maCn }, { soTinChiHocPhan });
    if (!result.affected) throw new NotFoundException('Không tìm thấy chương trình đào tạo');
    return this.chuyenNganhRepo.findOneBy({ maCn });
  }
}
