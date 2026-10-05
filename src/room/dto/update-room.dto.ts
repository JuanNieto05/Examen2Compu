import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] UpdateDto con UN CAMPO EXTRA
// -----------------------------------------------------------------------------
// Caso tipico: hay campos que NO se envian al crear (tienen default en la
// entidad) pero SI se pueden editar despues. Aqui 'available' tiene
// @Column({ default: true }) en la entidad, por eso no esta en CreateRoomDto,
// pero debe poder cambiarse con un PUT.
//
// Con la version corta serian estas dos piezas:
//   export class UpdateRoomDto extends PartialType(CreateRoomDto) {
//     @IsOptional() @IsBoolean() available?: boolean;
//   }
// (mira la advertencia sobre @nestjs/mapped-types en update-hotel.dto.ts)
// =============================================================================
export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El numero de habitacion no puede estar vacio' })
  roomNumber?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El tipo de habitacion no puede estar vacio' })
  type?: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El precio debe ser un numero' },
  )
  @Min(0.01, { message: 'El precio por noche debe ser mayor que 0' })
  pricePerNight?: number;

  @IsOptional()
  @IsInt({ message: 'La capacidad debe ser un numero entero' })
  @Min(1, { message: 'La capacidad minima es 1' })
  capacity?: number;

  @IsOptional()
  @IsString()
  description?: string;

  // Campo que NO esta en CreateRoomDto (tiene default en la entidad)
  @IsOptional()
  @IsBoolean({ message: 'available debe ser true o false' })
  available?: boolean;
}
