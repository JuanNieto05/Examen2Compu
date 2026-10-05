import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] DTO con validaciones - CreateUserDto (4 validaciones)
// -----------------------------------------------------------------------------
// REGLA DE ORO: el decorador se pone SOBRE la propiedad y SIEMPRE se importa
// desde 'class-validator'. Si no registraste el ValidationPipe en main.ts,
// NADA de esto se ejecuta.
//
// CHULETA DE DECORADORES (los que piden en el 90% de los parciales):
//   @IsNotEmpty()          -> no puede ser '' ni null ni undefined
//   @IsString()            -> debe ser texto
//   @IsNumber()            -> debe ser numero
//   @IsEmail()             -> formato de correo valido
//   @MinLength(n)/@MaxLength(n) -> largo de un string
//   @Min(n)/@Max(n)        -> rango de un numero
//   @IsOptional()          -> si viene undefined se SALTAN los demas validadores
//   @IsDateString()        -> fecha en formato ISO ("2025-06-01")
//   @IsBoolean() @IsEnum(X) @IsArray() @IsUUID() @IsPositive()
//
// Mensaje personalizado: @IsNotEmpty({ message: 'El nombre es obligatorio' })
// =============================================================================
export class CreateUserDto {
  // VALIDACION 1: obligatorio + formato email
  @IsEmail({}, { message: 'El email debe tener un formato valido' })
  @IsNotEmpty({ message: 'El email es obligatorio' })
  email: string;

  // VALIDACION 2: obligatorio + minimo 6 caracteres
  @IsString()
  @IsNotEmpty({ message: 'La contrasena es obligatoria' })
  @MinLength(6, { message: 'La contrasena debe tener al menos 6 caracteres' })
  password: string;

  // VALIDACION 3: obligatorio
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  name: string;

  // VALIDACION 4: opcional -> @IsOptional() PRIMERO, si no, falla cuando no viene
  @IsOptional()
  @IsString()
  phone?: string;
}
