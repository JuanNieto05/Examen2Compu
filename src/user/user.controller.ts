import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  NotFoundException,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // [PARCIAL | NIVEL A: copiar literal] Ruta con sufijo propio: @Post('register') -> POST /users/register
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  // ===========================================================================
  // [PARCIAL | TEORIA: entender, no copiar] El 404 cuando el service NO lo lanza
  // ---------------------------------------------------------------------------
  // userService.findById() devuelve null si no existe (no lanza). Si el
  // controller devolviera ese null, la respuesta seria 200 con body vacio.
  // Por eso el chequeo va aqui. Lo IDEAL es lanzarlo en el service (como en
  // HotelService.findOne) y que el controller quede en una sola linea.
  // ===========================================================================
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  // [PARCIAL | NIVEL A: copiar literal] DELETE de usuario. Gracias al onDelete: 'CASCADE' de
  // booking.entity.ts, al borrar el usuario la BD borra sus reservas solas.
  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const success = await this.userService.delete(id);

    if (!success) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return { success };
  }
}
