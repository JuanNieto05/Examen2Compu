import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] DTO con validaciones - CreateRoomDto (4 validaciones)
// -----------------------------------------------------------------------------
// CASOS QUE SE REPITEN EN PARCIALES:
//   - precio > 0           -> @Min(0.01)   (NO @Min(0), 0 no es un precio valido)
//   - cantidad entera >= 1 -> @IsInt() + @Min(1)
//   - texto de catalogo    -> @IsIn([...]) o @IsEnum(MiEnum)
// =============================================================================
export class CreateRoomDto {
  // VALIDACION 1: obligatorio
  @IsString()
  @IsNotEmpty({ message: 'El numero de habitacion es obligatorio' })
  roomNumber: string;

  // VALIDACION 2: obligatorio.
  // Si quisieras restringir a valores concretos:
  //   import { IsIn } from 'class-validator';
  //   @IsIn(['single', 'double', 'suite'], { message: 'Tipo no valido' })
  @IsString()
  @IsNotEmpty({ message: 'El tipo de habitacion es obligatorio' })
  type: string; // 'single', 'double', 'suite'

  // VALIDACION 3: precio estrictamente mayor que 0
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un numero' },
  )
  @Min(0.01, { message: 'El precio por noche debe ser mayor que 0' })
  pricePerNight: number;

  // VALIDACION 4: entero >= 1 (una habitacion para 0 personas no existe)
  @IsInt({ message: 'La capacidad debe ser un numero entero' })
  @Min(1, { message: 'La capacidad minima es 1' })
  capacity: number;

  @IsOptional()
  @IsString()
  description?: string;
}
