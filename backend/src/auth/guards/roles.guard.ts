import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { VaiTro } from '../../common/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<VaiTro[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    const hasRole = requiredRoles.includes(user.vaiTro);
    if (!hasRole) {
      throw new ForbiddenException(
        `Quyền truy cập bị từ chối. Yêu cầu vai trò: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
