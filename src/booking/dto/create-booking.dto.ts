import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  Min,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

// =============================================================================
// [PARCIAL | NIVEL B: copiar y ajustar] VALIDADOR PERSONALIZADO que compara DOS campos del mismo DTO
// -----------------------------------------------------------------------------
// PROBLEMA: class-validator valida campo por campo, no sabe comparar
// "checkOutDate > checkInDate". Esta es la plantilla para resolverlo.
//
// COMO FUNCIONA:
//   args.object           -> el DTO completo (de ahi saco el OTRO campo)
//   args.constraints[0]   -> el nombre del campo contra el que comparo
//   validate() -> true = valido, false = lanza 400
//
// COMO REUTILIZARLO EN EL PARCIAL: cambia solo la linea del return.
//   Fin > Inicio  -> new Date(value) > new Date(related)
//   Confirmar password -> value === related
//   Max > Min     -> Number(value) > Number(related)
//
// USO: @IsAfterDate('checkInDate', { message: '...' })
// =============================================================================
export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAfterDate',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          // args.constraints[0] = el nombre del OTRO campo ('checkInDate')
          const [relatedPropertyName] = args.constraints as string[];

          // 'unknown' + cast en vez de 'any': ESLint avisa de cada 'any'
          // (regla no-explicit-any) y en un parcial eso son avisos amarillos
          // por todo el archivo. Record<string, unknown> es la forma limpia
          // de leer una propiedad dinamica de un objeto.
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];

          if (!value || !relatedValue) return false;

          return (
            new Date(value as string).getTime() >
            new Date(relatedValue as string).getTime()
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe ser posterior a ${args.constraints[0]}`;
        },
      },
    });
  };
}

// =============================================================================
// [PARCIAL | NIVEL A: copiar literal] DTO con fechas - CreateBookingDto
// -----------------------------------------------------------------------------
// @IsDateString() valida formato ISO ("2025-06-01" o "2025-06-01T00:00:00.000Z").
// Por JSON las fechas SIEMPRE llegan como string, por eso NO se usa @IsDate()
// (ese solo pasa si el valor ya es un objeto Date, lo que nunca ocurre en HTTP).
// =============================================================================
export class CreateBookingDto {
  @IsInt({ message: 'roomId debe ser un numero entero' })
  @Min(1, { message: 'roomId debe ser mayor que 0' })
  roomId: number;

  @IsNotEmpty({ message: 'La fecha de check-in es obligatoria' })
  @IsDateString({}, { message: 'checkInDate debe ser una fecha valida (ISO)' })
  checkInDate: Date;

  @IsNotEmpty({ message: 'La fecha de check-out es obligatoria' })
  @IsDateString({}, { message: 'checkOutDate debe ser una fecha valida (ISO)' })
  // Validador personalizado: el check-out tiene que ser DESPUES del check-in
  @IsAfterDate('checkInDate', {
    message: 'checkOutDate debe ser posterior a checkInDate',
  })
  checkOutDate: Date;
}
