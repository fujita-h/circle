import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  // デコレータで設定されたロールとトークンに含まれるロールを比較し、
  // 一致するロールが1つでもあれば true を返す。
  private matchRolesAny(authorizedRoles: string[], userTokenRoles: string[]): boolean {
    return authorizedRoles.some((role) => {
      return userTokenRoles.includes(role);
    });
  }

  canActivate(context: ExecutionContext): boolean {
    // Get Request from the context
    const request = context.switchToHttp().getRequest();

    // このGuardは、JwtAuthGuard で認証されていることが前提となる。
    // つまり、request.user が存在することが必要となる。
    // したがって request.userが存在しない場合は false を返し、認証を失敗させる。
    if (!request.user) {
      return false;
    }

    // Get Metadata from the controller
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    // if roles is not exists, return true
    if (!roles) {
      return true;
    }

    // if roles array is empty, return false
    if (roles.length === 0) {
      return false;
    }

    // roles の値を置換する。
    const params = request.params || {};
    const rolesReplaces = roles.map((role) => {
      Object.keys(params).forEach((key: any) => {
        role = role.replace(`:${key}`, params[key]);
      });
      return role;
    });

    //  トークンに含まれるロールを取得する。
    const userTokenRoles = request.user.roles || [];

    // ロールの比較を行い、結果を返す。
    const result = this.matchRolesAny(rolesReplaces, userTokenRoles);
    return result;
  }
}
