import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VaiTro, TrangThaiTaiKhoan } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    if (Buffer.byteLength(dto.matKhau, 'utf8') > 72) throw new BadRequestException('Mật khẩu vượt giới hạn 72 byte');
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email này đã được sử dụng trong hệ thống');
    }

    if (dto.vaiTro && dto.vaiTro !== VaiTro.HocVien) {
      throw new ForbiddenException(
        'Đăng ký trực tuyến chỉ dành cho Học viên / Nghiên cứu sinh. Tài khoản Giảng viên và Quản trị viên do Phòng Đào tạo Sau đại học cấp.',
      );
    }

    const salt = await bcrypt.genSalt(10);
    const matKhauHash = await bcrypt.hash(dto.matKhau, salt);

    const user = await this.usersService.create({
      hoTen: dto.hoTen,
      email: dto.email,
      matKhauHash,
      vaiTro: VaiTro.HocVien,
      sdt: dto.sdt,
    });

    const payload = { sub: user.maNd, email: user.email, vaiTro: user.vaiTro };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        maNd: user.maNd,
        hoTen: user.hoTen,
        email: user.email,
        vaiTro: user.vaiTro,
      },
    };
  }

  async login(dto: LoginDto) {
      const user = await this.usersService.findByEmail(dto.email.trim(), true);
      if (!user) {
        throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
      }

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(dto.matKhau, user.matKhauHash);
    } catch {
      isMatch = false;
    }

    const HASH_BCRYPT_HOP_LE = /^\$2[aby]\$\d{2}\$/;
    if (!isMatch && !HASH_BCRYPT_HOP_LE.test(user.matKhauHash || '')) {
      if (user.matKhauHash === dto.matKhau) {
        const salt = await bcrypt.genSalt(10);
        user.matKhauHash = await bcrypt.hash(dto.matKhau, salt);
        await this.usersService.create(user);
        isMatch = true;
      }
    }

    if (!isMatch) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.trangThai === TrangThaiTaiKhoan.Locked) {
      throw new ForbiddenException(
        'Tài khoản của bạn đang bị khóa. Vui lòng liên hệ Phòng Đào tạo Sau đại học để được mở khóa.',
      );
    }

    const payload = { sub: user.maNd, email: user.email, vaiTro: user.vaiTro };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        maNd: user.maNd,
        hoTen: user.hoTen,
        email: user.email,
        vaiTro: user.vaiTro,
        hocVien: user.hocVien,
        giangVien: user.giangVien,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    const { matKhauHash, ...rest } = user;
    return rest;
  }
}
