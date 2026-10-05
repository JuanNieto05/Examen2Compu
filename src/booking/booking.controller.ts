import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Delete,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Booking } from './booking.entity';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] PROTEGER UN ENDPOINT CON JWT - plantilla completa
  // ---------------------------------------------------------------------------
  // Para exigir token en una ruta hacen falta 3 piezas:
  //
  //   1) import { UseGuards } from '@nestjs/common';
  //      import { AuthGuard } from '@nestjs/passport';
  //
  //   2) @UseGuards(AuthGuard('jwt'))      <- sobre el metodo (solo esa ruta)
  //                                           o sobre la clase @Controller
  //                                           (protege TODAS las rutas)
  //
  //   3) leer el usuario del token:
  //        async create(@Request() req) { const userId = req.user.id; }
  //      req.user es EXACTAMENTE lo que devuelve validate() en jwt.strategy.ts.
  //
  //   Version limpia con decorador propio (muy valorado):
  //      export const GetUser = createParamDecorator(
  //        (data, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user,
  //      );
  //      ... async create(@GetUser() user: User) { ... }
  //
  // AQUI ESTA COMENTADO A PROPOSITO: no existe un endpoint de login que emita
  // tokens, asi que activarlo dejaria /bookings inalcanzable y devolveria 401 en
  // los tests e2e. EN EL PARCIAL: descomenta la linea de abajo si piden
  // proteger la ruta (y asegurate de que AuthModule este importado).
  // ===========================================================================
  // @UseGuards(AuthGuard('jwt'))
  @Post()
  async createBooking(
    // [PARCIAL | NIVEL A: copiar literal] Tipar req en vez de usar 'any'.
    // Con 'req: any' ESLint marca un aviso (no-explicit-any). Declarando solo
    // la forma que te interesa te quitas el aviso y ganas autocompletado:
    //   @Request() req: { user?: { id: number } }
    @Request() req: { user?: { id: number } },
    @Body() createBookingDto: CreateBookingDto,
  ): Promise<Booking> {
    // Con el guard activo, req.user viene del token y el ?? 1 sobra.
    const userId = req.user?.id ?? 1; // Default to 1 for testing
    return this.bookingService.create(userId, createBookingDto);
  }

  @Get(':id')
  async getBooking(@Param('id', ParseIntPipe) id: number): Promise<Booking> {
    return this.bookingService.findOne(id);
  }

  // ===========================================================================
  // [PARCIAL | TEORIA: entender, no copiar] !! ORDEN DE LAS RUTAS - ERROR QUE CUESTA PUNTOS !!
  // ---------------------------------------------------------------------------
  // Nest/Express evaluan las rutas EN EL ORDEN EN QUE ESTAN DECLARADAS.
  // 'user/:userId' y 'room/:roomId' son rutas con prefijo fijo, asi que NO
  // chocan con @Get(':id'). Pero si declaras una ruta ESTATICA como
  // @Get('search') DESPUES de @Get(':id'), jamas se ejecuta: ':id' captura
  // primero la palabra "search" y el ParseIntPipe responde 400.
  //
  // REGLA: las rutas estaticas SIEMPRE antes que las parametrizadas.
  //   @Get('search')   OK
  //   @Get('active')   OK
  //   @Get(':id')      <- esta va de ULTIMA
  // ===========================================================================
  @Get('user/:userId')
  async getUserBookings(
    @Param('userId', ParseIntPipe) userId: number,
  ): Promise<Booking[]> {
    return this.bookingService.findByUser(userId);
  }

  @Get('room/:roomId')
  async getRoomBookings(
    @Param('roomId', ParseIntPipe) roomId: number,
  ): Promise<Booking[]> {
    return this.bookingService.findByRoom(roomId);
  }

  // [PARCIAL | NIVEL B: copiar y ajustar] ENDPOINT 5/5 - DELETE que NO borra, sino que cancela.
  // Es un "soft delete" de negocio: el service cambia status a 'cancelled'.
  @Delete(':id')
  async cancelBooking(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const booking = await this.bookingService.cancel(id);
    return { success: booking.status === 'cancelled' };
  }
}
