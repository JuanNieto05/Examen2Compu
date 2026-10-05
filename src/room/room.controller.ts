import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { Room } from './room.entity';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] RUTAS ANIDADAS (nested routes)
// -----------------------------------------------------------------------------
//   @Controller('hotels/:hotelId/rooms')
//
// El :hotelId del @Controller esta disponible en TODOS los metodos con
// @Param('hotelId'). Es el patron para recursos que pertenecen a otro:
//   /hotels/:hotelId/rooms          -> habitaciones de ESE hotel
//   /users/:userId/bookings         -> reservas de ESE usuario
//   /hotels/:hotelId/rooms/:id      -> una habitacion concreta
// =============================================================================
@Controller('hotels/:hotelId/rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Post()
  async createRoom(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Body() createRoomDto: CreateRoomDto,
  ): Promise<Room> {
    return this.roomService.create(hotelId, createRoomDto);
  }

  @Get()
  async getAllRooms(
    @Param('hotelId', ParseIntPipe) hotelId: number,
  ): Promise<Room[]> {
    return this.roomService.findAll(hotelId);
  }

  @Get(':id')
  async getRoom(@Param('id', ParseIntPipe) id: number): Promise<Room> {
    return this.roomService.findOne(id);
  }

  // [PARCIAL | NIVEL A: copiar literal] ENDPOINT 3/5 - PUT. Igual que el de hotel pero con UpdateRoomDto,
  // que ademas permite cambiar 'available'.
  @Put(':id')
  async updateRoom(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    return this.roomService.update(id, updateRoomDto);
  }

  // [PARCIAL | NIVEL A: copiar literal] ENDPOINT 4/5 - DELETE
  @Delete(':id')
  async deleteRoom(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const success = await this.roomService.delete(id);
    return { success };
  }
}
