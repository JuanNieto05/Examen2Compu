import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Room } from '../room/room.entity';

@Entity()
export class Hotel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  location: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  // decimal(5,2) -> hasta 999,99. Para un rating 0..5 sobra.
  @Column('decimal', { precision: 5, scale: 2 })
  rating: number;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  // [PARCIAL | NIVEL A: copiar literal] Hotel 1 --- N Room. El onDelete:'CASCADE' esta en el lado
  // @ManyToOne de Room (ver room.entity.ts), que es donde vive la FK.
  @OneToMany(() => Room, (room) => room.hotel, {
    cascade: ['insert', 'update'],
  })
  rooms: Room[];
}
