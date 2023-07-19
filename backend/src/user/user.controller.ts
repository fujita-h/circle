import {
  Controller,
  Logger,
  UseGuards,
  Request,
  Response,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  NotAcceptableException,
  InternalServerErrorException,
  Put,
  Query,
  ParseIntPipe,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import * as Iron from '@hapi/iron';
import { UsersService } from '../users/users.service';
import { GroupsService } from '../groups/groups.service';
import { MembershipsService } from '../memberships/memberships.service';
import { AzblobService } from '../azblob/azblob.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../guards/jwt.auth.guard';
import { JwtRolesGuard } from '../guards/jwt.roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { RestError } from '@azure/storage-blob';
import * as jdenticon from 'jdenticon';

@UseGuards(JwtAuthGuard, JwtRolesGuard)
@Controller('user')
export class UserController {
  private logger = new Logger(UserController.name);
  private IRON_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly groupsService: GroupsService,
    private readonly membershipsService: MembershipsService,
    private readonly blobsService: AzblobService,
  ) {
    if (!this.configService.get<string>('IRON_SECRET')) {
      this.logger.error('IRON_SECRET is not defined');
      throw new Error('IRON_SECRET is not defined');
    }
    this.IRON_SECRET = this.configService.get<string>('IRON_SECRET') || '';
  }

  checkHandle(handle: string) {
    if (!handle || !handle.match(/^[a-zA-Z][0-9a-zA-Z\-]{2,}$/i)) {
      throw new Error('Invalid handle');
    }
  }

  @Get()
  async findOne(@Request() request: any) {
    const userId = request.user.id;
    // check input
    if (!userId) {
      throw new Error('Invalid input');
    }
    return await this.usersService.findOne({ where: { id: userId } });
  }

  @Get('token')
  async getToken(@Request() request: any, @Response({ passthrough: true }) response: any) {
    const token = await Iron.seal(request.user, this.IRON_SECRET, Iron.defaults);
    response.cookie('filesToken', token, {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/files/',
    });
    return {};
  }

  @Get('/joined/groups')
  async findJoinedGroups(
    @Request() request: any,
    @Query('skip', ParseIntPipe) skip?: number,
    @Query('take', ParseIntPipe) take?: number,
  ) {
    const userId = request.user.id;
    return await this.membershipsService.findMany({
      where: { userId, role: { in: ['ADMIN', 'MEMBER'] } },
      orderBy: { createdAt: 'asc' },
      include: { group: true },
      skip,
      take,
    });
  }

  @Get('/joined/groups/count')
  async countJoinedGroups(@Request() request: any) {
    const userId = request.user.id;
    return await this.membershipsService.count({
      where: { userId, role: { in: ['ADMIN', 'MEMBER'] } },
    });
  }

  @Get('/joined/groups/handle/:handle')
  async findJoinedGroupByHandle(@Request() request: any, @Param('handle') handle: string) {
    const userId = request.user.id;
    return await this.membershipsService.findFirst({
      where: { userId, role: { in: ['ADMIN', 'MEMBER'] }, group: { handle } },
    });
  }

  @Put('joined/groups/:groupId')
  async joinGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    if (!userId) {
      throw new UnauthorizedException();
    }

    let group;
    try {
      group = await this.groupsService.findOne({ where: { id: groupId } });
    } catch (e) {
      throw new InternalServerErrorException();
    }
    if (!group) {
      throw new NotFoundException();
    }

    if (group.joinGroupCondition === 'DENIED') {
      throw new ForbiddenException();
    }

    const role =
      group.joinGroupCondition === 'REQUIRE_ADMIN_APPROVAL' ? 'PENDING_APPROVAL' : 'MEMBER';

    return this.membershipsService.createIfNotExists({ userId, groupId, role });
  }

  @Delete('joined/groups/:groupId')
  leaveGroup(@Request() request: any, @Param('groupId') groupId: string) {
    const userId = request.user.id;
    return this.membershipsService.removeIfExists({ userId, groupId });
  }

  @Get('/groups/postable')
  async findPostable(@Request() request: any) {
    const userId = request.user.id;

    // check input
    if (!userId) {
      throw new Error('Invalid input');
    }

    return await this.groupsService.findMany({
      where: {
        status: 'NORMAL',
        handle: { not: null },
        members: { some: { user: { id: userId }, role: { in: ['ADMIN', 'MEMBER'] } } },
      },
    });
  }

  @Patch()
  update(@Request() request: any, @Body() data: UpdateUserDto) {
    const userId = request.user.id;

    // check input
    if (!userId) {
      throw new Error('Invalid input');
    }

    if (data.handle) {
      try {
        this.checkHandle(data.handle);
      } catch (e) {
        throw new NotAcceptableException();
      }
    }

    return this.usersService.update({
      where: { id: userId },
      data: {
        handle: data.handle ?? undefined,
        name: data.name ?? undefined,
        email: data.email ?? undefined,
      },
    });
  }

  @Get('photo')
  async getPhoto(@Request() request: any, @Response() response: any) {
    try {
      const id = request.user.id;
      const downloadBlockBlobResponse = await this.blobsService.downloadBlob('user', `${id}/photo`);
      response.setHeader('Content-Type', downloadBlockBlobResponse.contentType);
      downloadBlockBlobResponse.readableStreamBody?.pipe(response);
    } catch (e) {
      if (e instanceof RestError) {
        if (e.statusCode === 404) {
          const png = jdenticon.toPng(request.user.id, 256, {
            padding: 0.15,
            backColor: '#F0F0F0',
            saturation: { color: 0.75 },
          });
          response.setHeader('Content-Type', 'image/png');
          response.setHeader('Content-Length', png.length);
          response.send(png);
        }
      }
      throw new InternalServerErrorException();
    }
  }

  @Post('/photo')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(@Request() request: any, @UploadedFile() file: Express.Multer.File) {
    const userId = request.user.id;
    if (!userId) {
      throw new NotAcceptableException('Invalid input');
    }
    if (
      file.mimetype !== 'image/jpeg' &&
      file.mimetype !== 'image/gif' &&
      file.mimetype !== 'image/png'
    ) {
      throw new NotAcceptableException('Invalid file type');
    }
    if (file.size > 1024 * 128) {
      throw new NotAcceptableException('File too large');
    }
    try {
      return this.blobsService.uploadBlob('user', `${userId}/photo`, file.mimetype, file.buffer);
    } catch (e) {
      throw new InternalServerErrorException();
    }
  }
}
