import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] UpdateDto - todos los campos OPCIONALES
// -----------------------------------------------------------------------------
// REGLA: en un Update, TODOS los campos llevan @IsOptional() y conservan sus
// validadores. Asi puedes mandar solo { "rating": 4.9 } y se valida el rango,
// pero no te exige reenviar el resto del objeto.
//
// @IsOptional() SIEMPRE PRIMERO: si viene undefined, se salta los demas
// validadores. Si lo pones al final, @IsNotEmpty falla con los campos ausentes.
//
// -----------------------------------------------------------------------------
// LA VERSION CORTA (ojo, lee la advertencia):
//
//   import { PartialType } from '@nestjs/mapped-types';
//   export class UpdateHotelDto extends PartialType(CreateHotelDto) {}
//
// PartialType() genera esta misma clase automaticamente: coge CreateHotelDto,
// hace todas las propiedades opcionales y conserva los decoradores. Si el
// proyecto usa Swagger, el import es de '@nestjs/swagger' (misma sintaxis).
//
// POR QUE NO SE USA AQUI: @nestjs/mapped-types v12 es un paquete SOLO-ESM
// ("type": "module", sin build CommonJS). La app y los unit tests funcionan,
// pero el Jest de los e2e corre en CommonJS y no puede cargarlo:
//   "Must use import to load ES Module: .../mapped-types/dist/index.js"
// Escribirlo a mano no depende de nada y funciona en los tres sitios.
//
// EN EL PARCIAL: prueba primero PartialType (es una linea). Si te sale ese
// error al correr los tests, cambialo por esta version explicita.
//
// NO USES Partial<CreateHotelDto> (el de TypeScript): es solo tipado, se borra
// al compilar y NO valida nada en runtime.
// =============================================================================
export class UpdateHotelDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre del hotel no puede estar vacio' })
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La ubicacion no puede estar vacia' })
  location?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La ciudad no puede estar vacia' })
  city?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El pais no puede estar vacio' })
  country?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El rating debe ser un numero' },
  )
  @Min(0, { message: 'El rating minimo es 0' })
  @Max(5, { message: 'El rating maximo es 5' })
  rating?: number;

  @IsOptional()
  @IsString()
  description?: string;
}
