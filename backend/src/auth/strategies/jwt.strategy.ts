import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { TrangThaiTaiKhoan } from '../../common/enums';
import { jwtSecret } from '../jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: { sub: string; email: string; vaiTro: string }) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại hoặc phiên đăng nhập hết hạn');
    }
    if (user.trangThai === TrangThaiTaiKhoan.Locked) {
      throw new UnauthorizedException('Tài khoản đã bị khóa bởi Phòng Đào tạo Sau đại học');
    }
    return {
      maNd: user.maNd,
      email: user.email,
      hoTen: user.hoTen,
      vaiTro: user.vaiTro,
      hocVien: user.hocVien,
      giangVien: user.giangVien,
    };
  }
}
