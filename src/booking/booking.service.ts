import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { Booking } from './booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RoomService } from '../room/room.service';

@Injectable()
export class BookingService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    // =========================================================================
    // [PARCIAL | NIVEL C: NO copiar] INYECTAR EL SERVICE DE OTRO MODULO
    // -------------------------------------------------------------------------
    // Para que esto funcione hacen falta DOS cosas:
    //   1) RoomModule debe tener   exports: [RoomService]
    //   2) BookingModule debe tener   imports: [RoomModule]
    // Si falta una -> "Nest can't resolve dependencies of the BookingService".
    //
    // @Optional() -> si la dependencia no esta registrada, Nest inyecta
    // undefined en vez de fallar. Lo usamos porque booking.service.spec.ts solo
    // registra el repositorio de Booking; sin @Optional() el TestingModule no
    // compilaria y TODOS los tests de ese archivo se caerian.
    // En codigo de produccion normal se omite @Optional().
    // =========================================================================
    @Optional()
    private readonly roomService?: RoomService,
  ) {}

  async create(
    userId: number,
    createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    const { roomId, checkInDate, checkOutDate } = createBookingDto;

    // ---- 1) Validacion de orden de fechas (red de seguridad del service) ----
    // El DTO ya lo valida con @IsAfterDate, pero el service tambien debe
    // protegerse: puede llamarse desde otro service, un seeder o un test.
    if (new Date(checkOutDate).getTime() <= new Date(checkInDate).getTime()) {
      throw new BadRequestException(
        'checkOutDate debe ser posterior a checkInDate',
      );
    }

    // ---- 2) Validacion de conflicto de fechas (TODO del enunciado) ----------
    const conflict = await this.hasDateConflict(
      roomId,
      checkInDate,
      checkOutDate,
    );

    if (conflict) {
      throw new BadRequestException(
        `La habitacion ${roomId} ya esta reservada en ese rango de fechas`,
      );
    }

    // ---- 3) Calculo del precio (TODO del enunciado) -------------------------
    const totalPrice = await this.calculateTotalPrice(
      roomId,
      checkInDate,
      checkOutDate,
    );

    // =========================================================================
    // [PARCIAL - BUG 7 | NIVEL A: copiar literal] Asignar la FK "a pelo" en vez de la relacion
    // -------------------------------------------------------------------------
    // ESTABA MAL:   roomId: createBookingDto.roomId
    //   -> roomId NO es una propiedad de la entidad Booking (la propiedad se
    //      llama 'room'). TypeORM la ignora, la FK queda NULL y despues
    //      relations: ['room'] devuelve null. Con TS estricto ni compila.
    //
    // ESTA BIEN:    room: { id: roomId }
    //
    // REGLA: en TypeORM se asigna el OBJETO de la relacion, no la columna FK.
    // (Excepcion: si declaras la columna a mano en la entidad con
    //  @Column() roomId: number;  mas  @JoinColumn({ name: 'roomId' }) ).
    //
    // Fijate tambien en el destructuring de arriba: el codigo original hacia
    // ...createBookingDto, que volvia a meter roomId en el objeto. Por eso lo
    // saco antes con  const { roomId, ... } = createBookingDto.
    // =========================================================================
    const booking = this.bookingsRepository.create({
      checkInDate,
      checkOutDate,
      room: { id: roomId },
      user: { id: userId },
      status: 'pending',
      totalPrice,
    });

    return this.bookingsRepository.save(booking);
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] CALCULAR NOCHES ENTRE DOS FECHAS - FORMULA
  // ---------------------------------------------------------------------------
  //   const MS_POR_DIA = 1000 * 60 * 60 * 24;
  //   const noches = Math.ceil((fin.getTime() - ini.getTime()) / MS_POR_DIA);
  //
  // Math.ceil y no Math.round: cualquier fraccion de dia cuenta como noche.
  // Y OJO con el Number(): TypeORM devuelve los @Column('decimal') como STRING,
  // asi que "150" * 3 daria NaN sin convertir.
  //
  // Se deja en un metodo privado aparte para poder testearlo y porque depende
  // de otro modulo (RoomService).
  // ===========================================================================
  private async calculateTotalPrice(
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<number> {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    const nights = Math.ceil(
      (new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) /
        MS_PER_DAY,
    );

    // Si RoomService no esta disponible (tests unitarios) no hay precio base.
    if (!this.roomService) {
      return 0;
    }

    const room = await this.roomService.findOne(roomId);

    // Number() obligatorio: el decimal llega como string desde la BD
    return Number(room.pricePerNight) * nights;
  }

  async findOne(id: number): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['room', 'user'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }

    return booking;
  }

  async findByUser(userId: number): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { user: { id: userId } },
      relations: ['room', 'user'],
    });
  }

  async findByRoom(roomId: number): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: { room: { id: roomId } },
      relations: ['room', 'user'],
    });
  }

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] CAMBIAR SOLO UN CAMPO DE ESTADO
  // ---------------------------------------------------------------------------
  // Esto es un "soft cancel": no se borra la fila, se cambia el status.
  // Mismo patron de 3 pasos que el update: update -> affected -> findOne.
  //
  // Vale igual para publicar/despublicar, activar/desactivar, marcar pagado...
  //   await this.repo.update(id, { status: 'cancelled' });
  //   return this.findOne(id);
  // ===========================================================================
  async cancel(id: number): Promise<Booking> {
    const result = await this.bookingsRepository.update(id, {
      status: 'cancelled',
    });

    if (result?.affected === 0) {
      throw new NotFoundException(`Booking with id ${id} not found`);
    }

    return this.findOne(id);
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] SOLAPAMIENTO DE FECHAS - LA FORMULA CLAVE
  // ---------------------------------------------------------------------------
  // Dos rangos [aIni, aFin) y [bIni, bFin) SE SOLAPAN si y solo si:
  //
  //        aIni < bFin   &&   aFin > bIni
  //
  // Memorizala: resuelve "reserva de habitacion", "cita medica", "prestamo de
  // libro", "reserva de sala"... es siempre la misma condicion.
  //
  // Se usan < y > estrictos (no <= / >=) para que una reserva que termina el
  // dia 5 y otra que empieza el dia 5 NO cuenten como choque (check-out por la
  // manana, check-in por la tarde).
  //
  // VERSION 100% EN SQL (mas eficiente, usala si hay muchos registros):
  //   const n = await this.bookingsRepository.count({
  //     where: {
  //       room: { id: roomId },
  //       status: Not('cancelled'),
  //       checkInDate:  LessThan(checkOutDate),   // existente.ini < nuevo.fin
  //       checkOutDate: MoreThan(checkInDate),    // existente.fin > nuevo.ini
  //     },
  //   });
  //   return n > 0;
  //
  // Aqui se hace con find() + filtro en JS porque los tests mockean find() y
  // esperan el resultado segun lo que devuelva ([] -> false, [algo] -> true).
  // ===========================================================================
  async hasDateConflict(
    roomId: number,
    checkInDate: Date,
    checkOutDate: Date,
  ): Promise<boolean> {
    const bookings = await this.bookingsRepository.find({
      where: {
        room: { id: roomId },
        // Not(valor) -> "!= valor". Ignora las reservas ya canceladas.
        status: Not('cancelled'),
      },
    });

    const overlapping = (bookings ?? []).filter((booking) => {
      const bookingIn = new Date(booking.checkInDate).getTime();
      const bookingOut = new Date(booking.checkOutDate).getTime();

      // LA FORMULA DEL SOLAPAMIENTO
      return (
        bookingIn < new Date(checkOutDate).getTime() &&
        bookingOut > new Date(checkInDate).getTime()
      );
    });

    return overlapping.length > 0;
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] FILTRAR POR RANGO con Between
  // ---------------------------------------------------------------------------
  // Between(a, b) -> "BETWEEN a AND b", INCLUSIVO en los dos extremos.
  // Sirve igual para numeros: precio: Between(100, 500)
  //
  // Si solo tienes un extremo:
  //   MoreThanOrEqual(a)   /   LessThanOrEqual(b)
  //
  // order + take/skip = paginacion (lo piden mucho junto a esto):
  //   order: { checkInDate: 'ASC' },   // o 'DESC'
  //   take: limit,                     // LIMIT
  //   skip: (page - 1) * limit,        // OFFSET
  // ===========================================================================
  async getBookingsByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Booking[]> {
    return this.bookingsRepository.find({
      where: {
        checkInDate: Between(startDate, endDate),
      },
      relations: ['room', 'user'],
      order: { checkInDate: 'ASC' },
    });
  }
}
