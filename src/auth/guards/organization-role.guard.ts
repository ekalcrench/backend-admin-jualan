import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationUserRole } from '../../common/enums/organization-user-role.enum.js';
import { ORGANIZATION_ROLES_KEY } from '../decorators/organization-roles.decorator.js';

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<
      OrganizationUserRole[]
    >(ORGANIZATION_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) =>
      user.organization_roles?.includes(role),
    );
  }
}
