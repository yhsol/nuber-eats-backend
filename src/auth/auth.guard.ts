import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from 'src/jwt/jwt.service';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { AllowedRoles } from './role.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<AllowedRoles>(
      'roles',
      context.getHandler(),
    );

    // 메타데이터가 설정되어 있지 않으면 통과
    if (!roles) return true;

    const gqlContext = GqlExecutionContext.create(context).getContext();
    const token = gqlContext.token;

    if (!token) return false;

    const decoded = this.jwtService.verify(token.toString());

    if (typeof decoded === 'object' && decoded.hasOwnProperty('id')) {
      const { user } = await this.usersService.findById(decoded['id']);

      // 메타데이터가 있는데 user가 없으면 false
      if (!user) return false;

      // gqlContext 에 user 추가
      gqlContext['user'] = user;

      // 메타데이터가 'Any' 이면 통과
      if (roles.includes('Any')) return true;

      // 메타데이터와 user 의 role 비교
      return roles.includes(user.role);
    }

    return false;
  }
}
