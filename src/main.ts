// #############################################################################
// ##  LEYENDA DE LA GUIA DE PARCIAL                                          ##
// #############################################################################
// Todos los bloques de ayuda estan marcados con [PARCIAL ...]. Busca "PARCIAL"
// en el proyecto (Ctrl+Shift+F) para listarlos todos. Cada uno lleva su NIVEL
// de reutilizacion:
//
//   [PARCIAL | NIVEL A: copiar literal]
//        Lo pegas y solo renombras la entidad (Hotel -> Producto). Funciona.
//        Aqui esta el CRUD, los modulos, los DTOs, los controllers y el JWT.
//
//   [PARCIAL | NIVEL B: copiar y ajustar]
//        Lo pegas y cambias 1 o 2 lineas (los nombres de los campos, el
//        return de una comparacion, los campos del where).
//        Aqui estan las formulas: solapamiento de fechas, calculo de noches,
//        busqueda con Like, validador de dos campos.
//
//   [PARCIAL | NIVEL C: NO copiar]
//        Es un parche de ESTE taller para que los tests pasen. Si lo copias
//        tal cual en un parcial, metes un bug o un agujero de seguridad.
//        El comentario te dice que poner en su lugar.
//
//   [PARCIAL | TEORIA: entender, no copiar]
//        No es codigo que pegar: es el "por que". Son los errores de
//        compilacion y los conceptos que suelen preguntar de forma oral o
//        escrita (create vs save, strictNullChecks, orden de las rutas).
//
//   [PARCIAL - BUG n | NIVEL ...]
//        Uno de los 7 bugs que tenia el taller, ya corregido, con la
//        explicacion de como detectarlo. El NIVEL es de la CORRECCION.
// #############################################################################

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ===========================================================================
  // [PARCIAL - BUG 1 | NIVEL A: copiar literal] ValidationPipe global
  // ---------------------------------------------------------------------------
  // QUE HACE: activa los decoradores de class-validator de TODOS los DTOs.
  // SIN ESTA LINEA los @IsNotEmpty/@IsEmail/@Min NO se ejecutan nunca y la API
  // acepta cualquier basura (los tests que esperan 400 devuelven 201).
  //
  // El bug original: ValidationPipe estaba IMPORTADO pero nunca registrado.
  //
  // OPCIONES (apréndelas, se piden siempre):
  //  - whitelist: true            -> borra del body las propiedades que no esten en el DTO
  //  - forbidNonWhitelisted: true -> en vez de borrarlas, lanza 400
  //  - transform: true            -> convierte tipos ("5" -> 5) usando class-transformer
  //
  // COPIA/PEGA: esto va SIEMPRE en main.ts de cualquier parcial de NestJS.
  // ===========================================================================
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
