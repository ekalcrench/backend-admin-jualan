import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  // @Post()
  // create(@Body() dto: CreateUserDto) {
  //   return this.userService.create(dto);
  // }
}
