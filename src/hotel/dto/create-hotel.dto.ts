import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] DTO con validaciones - CreateHotelDto (4 validaciones)
// -----------------------------------------------------------------------------
// LO IMPORTANTE AQUI: validar un NUMERO EN UN RANGO (@Min + @Max), que es el
// caso clasico de "rating de 0 a 5", "edad de 18 a 99", "nota de 0 a 100".
//
// OJO con @IsNumber: el body de un POST llega como JSON, pero si el dato viene
// de un query param o un form llega como STRING y @IsNumber falla. Solucion:
//   - ValidationPipe con transform: true  (ya lo pusimos en main.ts), o
//   - @Type(() => Number) de 'class-transformer' sobre la propiedad.
// =============================================================================
export class CreateHotelDto {
  // VALIDACION 1: obligatorio
  @IsString()
  @IsNotEmpty({ message: 'El nombre del hotel es obligatorio' })
  name: string;

  // VALIDACION 2: obligatorio
  @IsString()
  @IsNotEmpty({ message: 'La ubicacion es obligatoria' })
  location: string;

  // VALIDACION 3: obligatorio
  @IsString()
  @IsNotEmpty({ message: 'La ciudad es obligatoria' })
  city: string;

  // VALIDACION 4 (y la mas pedida): numero dentro de un rango 0..5
  // maxDecimalPlaces limita los decimales (4.55 ok, 4.555 -> 400)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El rating debe ser un numero' },
  )
  @Min(0, { message: 'El rating minimo es 0' })
  @Max(5, { message: 'El rating maximo es 5' })
  rating: number;

  @IsString()
  @IsNotEmpty({ message: 'El pais es obligatorio' })
  country: string;

  @IsOptional()
  @IsString()
  description?: string;
}
