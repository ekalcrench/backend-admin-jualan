import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationUserRole } from '../../common/enums/organization-user-role.enum.js';
import { ORGANIZATION_ROLES_KEY } from '../decorators/organization-roles.decorator.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { UserRole } from '../../common/enums/user-role.enum.js';

@Injectable()
export class OrganizationRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requiredOrganizationRoles = this.reflector.getAllAndOverride<
      OrganizationUserRole[]
    >(ORGANIZATION_ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (!requiredRoles && !requiredOrganizationRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    return (
      requiredRoles?.some((role) => user.roles?.includes(role)) ||
      requiredOrganizationRoles?.some((role) =>
        user.organization_roles?.includes(role),
      ) ||
      false
    );
  }
}
