import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from 'src/users/entities/user.entity';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    // 메타데이터가 설정되어 있지 않으면 통과
    if (!roles) return true;

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const user: User = gqlContext['user'];

    console.log('gqlContext: ', gqlContext.token);

    // 메타데이터가 있는데 user가 없으면 false
    if (!user) return false;

    // 메타데이터가 'Any' 이면 통과
    if (roles.includes('Any')) return true;

    // 메타데이터와 user 의 role 비교
    return roles.includes(user.role);
  }
}
