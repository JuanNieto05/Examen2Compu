import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './jwt.strategy';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] CONFIGURAR UN MODULO CON VARIABLES DE ENTORNO (registerAsync)
// -----------------------------------------------------------------------------
// PROBLEMA: JwtModule.register({ secret: process.env.JWT_SECRET }) se evalua
// cuando se CARGA el archivo, que puede ser ANTES de que ConfigModule haya
// leido el .env -> el secret queda undefined.
//
// SOLUCION: registerAsync + useFactory, que se ejecuta cuando Nest ya levanto
// la configuracion. ESTA ES LA PLANTILLA (sirve igual para TypeOrmModule,
// MailerModule, etc. -> todos tienen su forRootAsync/registerAsync):
//
//   XModule.registerAsync({
//     imports: [ConfigModule],                 // 1) de donde saco la config
//     inject:  [ConfigService],                // 2) que inyecto en la factory
//     useFactory: (config: ConfigService) => ({ // 3) devuelvo las opciones
//       secret: config.get<string>('JWT_SECRET'),
//     }),
//   })
//
// config.get('CLAVE')               -> lee la variable
// config.get('CLAVE', 'porDefecto') -> con valor por defecto si no existe
//
// En este proyecto ConfigModule.forRoot({ isGlobal: true }) esta en AppModule,
// asi que ConfigService ya esta disponible en todas partes.
// =============================================================================
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'dev-secret-key'),
        signOptions: {
          // [PARCIAL | NIVEL B: copiar y ajustar] OJO con el tipo de expiresIn: @nestjs/jwt lo tipa como
          // StringValue (un tipo literal de la libreria 'ms': '24h', '7d',
          // '60s'...), NO como string. Al venir de una variable de entorno es
          // un string generico y TS falla con:
          //   "Type 'string' is not assignable to type number | StringValue"
          // Por eso el cast. Si lo escribes literal, no hace falta:
          //   signOptions: { expiresIn: '24h' }
          expiresIn: configService.get<string>(
            'JWT_EXPIRES_IN',
            '24h',
          ) as `${number}h`,
        },
      }),
    }),
    UserModule,
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
