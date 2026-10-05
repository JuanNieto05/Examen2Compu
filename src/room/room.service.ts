import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomService {
  constructor(
    @InjectRepository(Room)
    private roomsRepository: Repository<Room>,
  ) {}

  async create(hotelId: number, createRoomDto: CreateRoomDto): Promise<Room> {
    // =========================================================================
    // [PARCIAL | NIVEL A: copiar literal] ASIGNAR UN PADRE SIN CARGARLO DE LA BD
    // -------------------------------------------------------------------------
    //   hotel: { id: hotelId }   <-- objeto "parcial" solo con el id
    //
    // TypeORM solo necesita el id para rellenar la FK, asi que te ahorras un
    // SELECT. Es el patron para rutas anidadas /hotels/:hotelId/rooms.
    //
    // CUANDO SI hay que cargar el padre: si necesitas validar que existe
    // (si no, SQLite acepta la FK invalida en algunos casos) o usar sus datos:
    //   const hotel = await this.hotelsRepository.findOneBy({ id: hotelId });
    //   if (!hotel) throw new NotFoundException(`Hotel ${hotelId} not found`);
    //
    // ERROR TIPICO: escribir  hotelId: hotelId . No existe esa propiedad en la
    // entidad (la columna se llama asi en la BD, pero en la clase la propiedad
    // es 'hotel'); TypeORM la ignora y la FK queda NULL. Es el mismo bug que
    // tenia booking.service.ts con 'roomId'.
    // =========================================================================
    const room = this.roomsRepository.create({
      ...createRoomDto,
      hotel: { id: hotelId },
    });

    return this.roomsRepository.save(room);
  }

  async findAll(hotelId: number): Promise<Room[]> {
    // [PARCIAL | NIVEL A: copiar literal] WHERE ANIDADO SOBRE LA RELACION:
    //   where: { hotel: { id: hotelId } }
    // TypeORM hace el JOIN y filtra por la columna del padre. Equivale a
    // "WHERE room.hotelId = :hotelId" y es la forma recomendada.
    return this.roomsRepository.find({
      where: { hotel: { id: hotelId } },
    });
  }

  async findOne(id: number): Promise<Room> {
    const room = await this.roomsRepository.findOne({
      where: { id },
      relations: ['hotel', 'bookings'],
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return room;
  }

  // [PARCIAL | NIVEL A: copiar literal] UPDATE - metodo 6/10. Identico al de HotelService:
  // update(id, dto) -> comprobar affected -> devolver findOne(id).
  async update(id: number, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const result = await this.roomsRepository.update(id, updateRoomDto);

    if (result?.affected === 0) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return this.findOne(id);
  }

  // [PARCIAL | NIVEL A: copiar literal] DELETE - metodo 7/10.
  async delete(id: number): Promise<boolean> {
    const result = await this.roomsRepository.delete(id);

    if (result?.affected === 0) {
      throw new NotFoundException(`Room with id ${id} not found`);
    }

    return true;
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] FILTRO SIMPLE POR BOOLEANO + RELACION (metodo 8/10)
  // ---------------------------------------------------------------------------
  // Combinar en el mismo objeto where = AND:
  //   hotel: { id: hotelId }  AND  available: true
  //
  // Otros operadores de 'typeorm' para el where (CHULETA):
  //   Not(x)              MoreThan(x)        LessThan(x)
  //   MoreThanOrEqual(x)  LessThanOrEqual(x) Between(a, b)
  //   In([a,b,c])         IsNull()           Like/ILike(`%x%`)
  // ===========================================================================
  async getAvailability(hotelId: number): Promise<Room[]> {
    return this.roomsRepository.find({
      where: {
        hotel: { id: hotelId },
        available: true,
      },
    });
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] SOLAPAMIENTO DE FECHAS (metodo 9/10) - LA FORMULA CLAVE
  // ---------------------------------------------------------------------------
  // Dos rangos [aIni, aFin) y [bIni, bFin) SE SOLAPAN si y solo si:
  //
  //        aIni < bFin   &&   aFin > bIni
  //
  // Memorizala: resuelve "reserva de habitacion", "cita medica", "prestamo de
  // libro", "reserva de sala"... Es siempre la misma condicion.
  //
  // Se usa < y > (estrictos) y no <= / >=, para que una reserva que termina el
  // dia 5 y otra que empieza el dia 5 NO cuenten como choque (check-out por la
  // manana, check-in por la tarde).
  //
  // Devuelve true si la habitacion esta LIBRE en ese rango.
  // Se ignoran las reservas 'cancelled': una reserva cancelada no bloquea.
  // ===========================================================================
  async isAvailableForDateRange(
    roomId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<boolean> {
    const room = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['bookings'],
    });

    if (!room) {
      throw new NotFoundException(`Room with id ${roomId} not found`);
    }

    // Si la habitacion esta marcada como no disponible, no hay nada que mirar
    if (room.available === false) {
      return false;
    }

    const overlapping = (room.bookings ?? []).filter((booking) => {
      if (booking.status === 'cancelled') return false;

      const bookingIn = new Date(booking.checkInDate).getTime();
      const bookingOut = new Date(booking.checkOutDate).getTime();

      // LA FORMULA
      return (
        bookingIn < new Date(endDate).getTime() &&
        bookingOut > new Date(startDate).getTime()
      );
    });

    return overlapping.length === 0;
  }
}
