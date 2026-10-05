import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] ESTRATEGIA JWT - plantilla copiable completa
// -----------------------------------------------------------------------------
// Las 3 piezas de la autenticacion con JWT en Nest:
//   1) jwt.strategy.ts  -> esta clase: valida el token y resuelve el usuario
//   2) auth.module.ts   -> registra JwtModule con el secret
//   3) @UseGuards(AuthGuard('jwt'))  -> protege las rutas
//
// COMO FUNCIONA EL FLUJO:
//   peticion con "Authorization: Bearer <token>"
//     -> jwtFromRequest extrae el token del header
//     -> passport verifica la FIRMA con secretOrKey y la expiracion
//     -> si es valido, llama a validate(payload) con el contenido del token
//     -> lo que devuelve validate() se guarda en req.user
//
// EL SECRET DEBE SER EL MISMO aqui y en auth.module.ts. Si no coinciden,
// todos los tokens dan 401 "Unauthorized" y es dificil de ver.
//
// OTRAS FORMAS DE EXTRAER EL TOKEN:
//   ExtractJwt.fromAuthHeaderAsBearerToken()   -> header Authorization (normal)
//   ExtractJwt.fromUrlQueryParameter('token')  -> ?token=...
//   ExtractJwt.fromExtractors([...])           -> varias a la vez (ej. cookies)
//
// ignoreExpiration: true  -> acepta tokens caducados. NO lo pongas salvo que
// el enunciado lo pida explicitamente.
// =============================================================================
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private userService: UserService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // [PARCIAL | NIVEL A: copiar literal] Secret desde variable de entorno (mismo valor que AuthModule)
      secretOrKey: configService.get<string>('JWT_SECRET', 'dev-secret-key'),
      ignoreExpiration: false,
    });
  }

  // [PARCIAL | NIVEL B: copiar y ajustar] validate() recibe el PAYLOAD ya verificado del token.
  // Lo que retornes aqui es EXACTAMENTE lo que luego lees con @Request() req
  // en  req.user  (o con tu decorador @GetUser()).
  //
  // Se consulta la BD a proposito: si el usuario fue borrado o desactivado
  // despues de emitir el token, su token deja de servir.
  async validate(payload: { id: number; email?: string }): Promise<User> {
    const user = await this.userService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('Token invalido o usuario inexistente');
    }

    return user;
  }
}
