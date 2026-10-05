import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Hotel } from '../hotel/hotel.entity';
import { Booking } from '../booking/booking.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  roomNumber: string;

  @Column()
  type: string; // 'single', 'double', 'suite'

  @Column('decimal', { precision: 10, scale: 2 })
  pricePerNight: number;

  @Column()
  capacity: number;

  // [PARCIAL | NIVEL A: copiar literal] default a nivel de BD: si el INSERT no manda 'available',
  // la columna queda en true. Por eso 'available' NO esta en CreateRoomDto.
  @Column({ default: true })
  available: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // [PARCIAL | NIVEL A: copiar literal] Lado DUENO de la FK (room.hotelId) -> aqui va onDelete.
  // Borrar un Hotel borra sus Rooms, y como Booking tambien tiene
  // onDelete:'CASCADE' hacia Room, se borran las reservas en cadena.
  @ManyToOne(() => Hotel, (hotel) => hotel.rooms, { onDelete: 'CASCADE' })
  hotel: Hotel;

  // [PARCIAL | NIVEL A: copiar literal] Lado INVERSO (no tiene FK). El segundo argumento
  // (booking) => booking.room es OBLIGATORIO para que TypeORM sepa emparejar
  // los dos lados; sin el, relations: ['bookings'] no funciona.
  @OneToMany(() => Booking, (booking) => booking.room)
  bookings: Booking[];
}
