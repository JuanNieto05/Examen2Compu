import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Booking } from '../booking/booking.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  // unique: true -> crea un indice UNICO en la BD. Es la segunda barrera
  // (la primera es el chequeo en el service) contra emails repetidos.
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  phone: string;

  // ===========================================================================
  // [PARCIAL - BUG 5 | NIVEL B: copiar y ajustar] Tipo de columna de fecha incompatible con el motor
  // ---------------------------------------------------------------------------
  // Estaba como { type: 'timestamp' }. 'timestamp' es de Postgres/MySQL;
  // SQLite NO lo soporta y TypeORM revienta al arrancar con
  // "DataTypeNotSupportedError: Data type timestamp is not supported by sqlite".
  //
  // TABLA DE EQUIVALENCIAS (apréndela, cambia segun el motor del parcial):
  //   SQLite      -> 'datetime'
  //   Postgres    -> 'timestamp'  o  'timestamptz'
  //   MySQL       -> 'datetime'   o  'timestamp'
  //
  // ALTERNATIVA PORTABLE (funciona en los 3 motores, no hay que elegir tipo):
  //   @CreateDateColumn() createdAt: Date;   // lo rellena TypeORM al insertar
  //   @UpdateDateColumn() updatedAt: Date;   // se actualiza en cada save()
  // ===========================================================================
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // ===========================================================================
  // [PARCIAL - BUG 3 | NIVEL A: copiar literal] Relacion OneToMany sin borrado en cascada
  // ---------------------------------------------------------------------------
  // QUE HACE cada opcion (NO son lo mismo, siempre lo preguntan):
  //
  //   cascade: true        -> CASCADA DE TYPEORM (nivel aplicacion). Al hacer
  //                           save(user) tambien guarda/actualiza/borra los
  //                           bookings que vengan en user.bookings.
  //                           Se pone en el lado DUENO de la operacion.
  //
  //   onDelete: 'CASCADE'  -> CASCADA DE LA BASE DE DATOS (nivel SQL). Genera
  //                           ON DELETE CASCADE en la FOREIGN KEY. Al borrar el
  //                           padre, la BD borra los hijos sola.
  //                           OJO: se pone en el lado @ManyToOne (donde esta la
  //                           FK), NO aqui. Mira booking.entity.ts.
  //
  // Aqui usamos cascade para insert/update/remove: permite crear un usuario con
  // sus reservas de un solo save() y que al remove(user) se limpien.
  // ===========================================================================
  @OneToMany(() => Booking, (booking) => booking.user, {
    cascade: ['insert', 'update', 'remove'],
  })
  bookings: Booking[];
}
