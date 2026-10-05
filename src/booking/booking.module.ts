import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { Booking } from './booking.entity';
import { RoomModule } from '../room/room.module';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] ANATOMIA DE UN MODULO - plantilla copiable
// -----------------------------------------------------------------------------
// @Module({
//   imports:     [ TypeOrmModule.forFeature([Entidad]), OtroModule ],
//   providers:   [ MiService ],      // lo que este modulo CREA
//   controllers: [ MiController ],   // las rutas HTTP
//   exports:     [ MiService ],      // lo que OTROS modulos pueden usar
// })
//
// LAS 4 CLAVES, SIN CONFUNDIRLAS:
//   forFeature([X]) -> registra el REPOSITORIO de X para poder hacer
//                      @InjectRepository(X). Va en CADA modulo que lo use.
//                      (forRoot() es distinto: la conexion, solo en AppModule.)
//   providers       -> servicios de ESTE modulo.
//   exports         -> sin esto, otro modulo no puede inyectar tu service
//                      aunque te importe. Es el error #1 de los parciales.
//   imports         -> modulos de los que necesito algo.
//
// IMPORTS CIRCULARES (A importa B y B importa A): usa forwardRef en los dos:
//   imports: [forwardRef(() => RoomModule)]
//   constructor(@Inject(forwardRef(() => RoomService)) private rs: RoomService)
// =============================================================================
@Module({
  imports: [
    TypeOrmModule.forFeature([Booking]),
    // [PARCIAL | NIVEL A: copiar literal] Necesario para que BookingService pueda inyectar RoomService
    // (y con el calcular el precio total). RoomModule lo exporta.
    RoomModule,
  ],
  providers: [BookingService],
  controllers: [BookingController],
  exports: [BookingService],
})
export class BookingModule {}
