import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] INYECCION DE UN REPOSITORIO (plantilla copiable)
  // ---------------------------------------------------------------------------
  //   @InjectRepository(Entidad)
  //   private repo: Repository<Entidad>
  //
  // REQUISITO: el modulo debe tener TypeOrmModule.forFeature([Entidad]) en sus
  // imports. Si falta, Nest lanza al arrancar:
  //   "Nest can't resolve dependencies of the XService (?).
  //    Please make sure that the argument EntidadRepository is available"
  // ===========================================================================
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // [PARCIAL | NIVEL A: copiar literal] Patron "comprobar duplicado antes de insertar"
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    // =========================================================================
    // [PARCIAL - BUG 6 | NIVEL A: copiar literal] Excepcion HTTP equivocada
    // -------------------------------------------------------------------------
    // Estaba lanzando NotFoundException (404) para un recurso DUPLICADO.
    // Lo correcto es ConflictException (409) y es lo que espera el test:
    //   expect(...).rejects.toThrow(ConflictException)
    //
    // CHULETA DE EXCEPCIONES DE NEST (de '@nestjs/common'):
    //   BadRequestException     -> 400  datos invalidos / regla de negocio
    //   UnauthorizedException   -> 401  no autenticado (falta/caduco el token)
    //   ForbiddenException      -> 403  autenticado pero sin permiso
    //   NotFoundException       -> 404  el recurso NO existe
    //   ConflictException       -> 409  el recurso YA existe / choque de estado
    //   UnprocessableEntityException -> 422
    //   InternalServerErrorException -> 500
    //
    // Nest las convierte solo en una respuesta JSON con su status code.
    // =========================================================================
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // [PARCIAL | NIVEL A: copiar literal] NUNCA guardes la contrasena en claro.
    // bcrypt.hash(texto, saltRounds) -> 10 es el valor estandar.
    // Para comparar en el login: await bcrypt.compare(plano, user.password)
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // [PARCIAL | TEORIA: entender, no copiar] create() solo construye el objeto en memoria (no toca la BD),
    // save() es el que hace el INSERT/UPDATE. Siempre van en pareja.
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  // ===========================================================================
  // [PARCIAL | TEORIA: entender, no copiar] strictNullChecks: findOne() PUEDE devolver null
  // ---------------------------------------------------------------------------
  // repo.findOne() esta tipado como  Promise<T | null>  en TypeORM 0.3+.
  // Si declaras  Promise<User>  el compilador falla con:
  //   "Type 'User | null' is not assignable to type 'User'"
  //
  // DOS FORMAS DE ARREGLARLO (elige segun lo que quieras que pase):
  //   1) Declarar el tipo honesto  Promise<User | null>  y que quien llame
  //      decida (es lo que hacemos aqui: el login necesita el null).
  //   2) Lanzar 404 dentro del service y devolver Promise<User>
  //      (es lo que hace HotelService.findOne).
  //
  // Atajo feo que NO uses en un parcial:  as User  /  !  (non-null assertion):
  // apaga el aviso pero el null sigue ahi en runtime.
  // ===========================================================================
  async findOne(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    // [PARCIAL | NIVEL B: copiar y ajustar] Ocultar columnas sensibles en el listado. Dos formas:
    //  1) select explicito, como aqui.
    //  2) @Column({ select: false }) password  en la entidad (se oculta siempre;
    //     para traerla en el login necesitas addSelect('user.password')).
    return this.usersRepository.find({
      select: ['id', 'email', 'name', 'phone', 'createdAt'],
    });
  }

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] DELETE - plantilla copiable (metodo 1/10)
  // ---------------------------------------------------------------------------
  // repo.delete(id) devuelve un DeleteResult: { raw, affected }
  //   affected = numero de filas borradas -> 0 significa que no existia.
  //
  // VARIANTES SEGUN LO QUE PIDAN:
  //   delete(id)        -> DELETE directo por id. Rapido, NO dispara cascade
  //                        de TypeORM (si la de la BD por onDelete).
  //   remove(entidad)   -> necesitas cargar la entidad primero; SI dispara
  //                        los cascade/hooks de TypeORM.
  //   softDelete(id)    -> borrado logico; requiere @DeleteDateColumn en la
  //                        entidad. Se recupera con restore(id).
  //
  // Variante "lanzar 404 si no existe" (muy pedida):
  //   const result = await this.repo.delete(id);
  //   if (result.affected === 0) throw new NotFoundException(`... ${id} ...`);
  //   return true;
  // ===========================================================================
  async delete(id: number): Promise<boolean> {
    const result = await this.usersRepository.delete(id);

    // [PARCIAL | TEORIA: entender, no copiar] 'affected' esta tipado como number | null | undefined, por eso
    // el (result.affected ?? 0). Sin el, TS avisa:
    //   "'result.affected' is possibly 'null' or 'undefined'"
    return (result.affected ?? 0) > 0;
  }
}
