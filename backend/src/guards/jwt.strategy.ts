import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { UsersService } from '../users/users.service';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class OidcJwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cahcheManager: Cache,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        // eslint-disable-next-line prettier/prettier
        jwksUri: `https://login.microsoftonline.com/${configService.get<string>('AAD_TENANT_ID')}/discovery/v2.0/keys`,
        handleSigningKeyError(err, cb) {
          console.error('handleSigningKeyError', err);
          cb(err);
        },
      }),
      issuer: `https://sts.windows.net/${configService.get<string>('AAD_TENANT_ID')}/`,
      audience: `api://${configService.get<string>('AAD_BACKEND_CLIENT_ID')}`,
      ignoreExpiration: false,
    });
  }

  async validate(token: any) {
    // additional validation
    try {
      // if oid is not present in the payload, then this is not a valid token
      if (!token.oid) {
        throw new Error('No oid claim');
      }

      let user;
      // check if the user is in the cache
      user = await this.cahcheManager.get(`user:${token.oid}`);

      // if the user is not in the cache, then check the database
      if (!user) {
        user = await this.usersService.findOne({ where: { oid: token.oid } });

        // if the user is not in the database, then create a new user
        if (!user) {
          const upn: string =
            token.preferred_username || token.unique_name || token.upn || token.email || token.oid;
          const handle = upn.replace('#', '_').split('@')[0];
          const name = token.name || token.given_name || token.family_name || '';
          user = await this.usersService.create({
            data: {
              oid: token.oid,
              handle: handle,
              name: name,
              email: token.email,
            },
          });

          // if failed to create a new user, then try to create a new user with the oid as the handle
          if (!user) {
            user = await this.usersService.create({
              data: {
                oid: token.oid,
                handle: token.oid,
                name: name,
                email: token.email,
              },
            });
          }
        }

        // if the user is in the database and failed to create a new user, then throw an error
        if (!user) {
          throw new Error('No oid claim');
        }

        // set the user in the cache
        await this.cahcheManager.set(`user:${user.oid}`, user, 60 * 1000);
      }
      return { ...user, token };
    } catch (err) {
      throw new UnauthorizedException('Unauthorized');
    }
  }
}
