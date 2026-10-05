import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';
import { Room } from '../room/room.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  // En SQLite las fechas se guardan como 'datetime' (ver BUG 5 en user.entity)
  @Column({ type: 'datetime' })
  checkInDate: Date;

  @Column({ type: 'datetime' })
  checkOutDate: Date;

  @Column({ default: 'pending' })
  status: string; // 'pending', 'confirmed', 'cancelled'

  // [PARCIAL | NIVEL A: copiar literal] Dinero SIEMPRE con 'decimal', NUNCA con float/number:
  //   precision = total de digitos, scale = digitos decimales
  //   decimal(10,2) -> hasta 99.999.999,99
  // OJO: TypeORM devuelve los decimal como STRING. Si necesitas operar:
  //   Number(booking.totalPrice)   o   { transformer: { to: v => v, from: v => Number(v) } }
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalPrice: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // ===========================================================================
  // [PARCIAL - BUG 4 | NIVEL A: copiar literal] @ManyToOne sin onDelete: 'CASCADE'
  // ---------------------------------------------------------------------------
  // El lado @ManyToOne es el que TIENE la foreign key (aqui: booking.roomId).
  // Por eso onDelete SIEMPRE se declara en este lado, no en el @OneToMany.
  //
  // onDelete: 'CASCADE'  -> al borrar la Room, la BD borra sus Bookings.
  // Otras opciones que pueden pedir:
  //   'SET NULL'  -> deja la FK en NULL (la columna debe ser nullable)
  //   'RESTRICT'  -> impide borrar el padre si tiene hijos (lanza error)
  //   'NO ACTION' -> comportamiento por defecto
  //
  // ANATOMIA DE LA RELACION (plantilla copiable):
  //   @ManyToOne(() => Padre, (padre) => padre.hijos, { onDelete: 'CASCADE' })
  //   padre: Padre;
  //      1) () => Padre            -> la clase destino (arrow para evitar
  //                                   problemas de imports circulares)
  //      2) (padre) => padre.hijos -> el LADO INVERSO. Es lo que permite usar
  //                                   relations: ['padre'] y los where anidados.
  //      3) { onDelete: ... }      -> opciones
  //
  // eager: true aqui haria que toda consulta de Booking traiga la Room sin
  // pedirlo; no se usa porque pesa. Mejor relations: ['room'] cuando haga falta.
  // ===========================================================================
  @ManyToOne(() => Room, (room) => room.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  room: Room;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  user: User;
}
