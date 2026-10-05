import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { HotelModule } from './hotel/hotel.module';
import { RoomModule } from './room/room.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
    }),
    UserModule,
    HotelModule,
    RoomModule,
    // =========================================================================
    // [PARCIAL - BUG 2 | NIVEL A: copiar literal] Modulo no registrado en el AppModule
    // -------------------------------------------------------------------------
    // QUE HACE: registrar BookingModule hace que Nest cargue su controller y su
    // service. SIN esta linea el modulo existe en el disco pero NINGUNA ruta de
    // /bookings queda montada -> todo /bookings responde 404.
    //
    // COMO DETECTARLO EN EL PARCIAL: arranca la app y mira el log de Nest.
    // Si no aparece "RoutesResolver BookingController {/bookings}" es que el
    // modulo no esta en este array.
    // =========================================================================
    BookingModule,
    AuthModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
