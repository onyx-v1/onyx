import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { can } from '../common/permissions';

/** Allows ADMIN and MODERATOR — use instead of AdminGuard where Mods also need access. */
@Injectable()
export class ModeratorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!can.accessServerSettings(request.user?.role)) {
      throw new ForbiddenException('Moderator or Admin access required');
    }
    return true;
  }
}
