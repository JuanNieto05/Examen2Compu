import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Hotel } from './hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';

@Injectable()
export class HotelService {
  constructor(
    @InjectRepository(Hotel)
    private hotelsRepository: Repository<Hotel>,
  ) {}

  async create(createHotelDto: CreateHotelDto): Promise<Hotel> {
    const hotel = this.hotelsRepository.create(createHotelDto);
    return this.hotelsRepository.save(hotel);
  }

  async findAll(): Promise<Hotel[]> {
    // [PARCIAL | NIVEL A: copiar literal] relations: ['rooms'] -> hace el JOIN y rellena hotel.rooms.
    // Para relaciones anidadas: relations: ['rooms', 'rooms.bookings']
    return this.hotelsRepository.find({ relations: ['rooms'] });
  }

  async findOne(id: number): Promise<Hotel> {
    const hotel = await this.hotelsRepository.findOne({
      where: { id },
      relations: ['rooms'],
    });

    // [PARCIAL | NIVEL A: copiar literal] Patron "findOne + 404". Repetilo en TODO findOne de parcial.
    if (!hotel) {
      throw new NotFoundException(`Hotel with id ${id} not found`);
    }

    return hotel;
  }

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] UPDATE - plantilla copiable (metodo 2/10)
  // ---------------------------------------------------------------------------
  // PATRON DE 3 PASOS (el mas pedido):
  //   1) repo.update(id, datos)   -> UPDATE parcial, solo las columnas enviadas
  //   2) comprobar affected === 0 -> si es 0, el id no existia -> 404
  //   3) devolver la entidad ya actualizada (this.findOne(id))
  //
  // repo.update() devuelve UpdateResult { raw, affected, generatedMaps }
  // y NO devuelve la entidad: por eso hace falta el paso 3.
  //
  // LIMITACION IMPORTANTE: repo.update() NO toca relaciones ni dispara cascade.
  // Si el parcial pide actualizar relaciones, usa el patron "preload + save":
  //   const hotel = await this.repo.preload({ id, ...dto });
  //   if (!hotel) throw new NotFoundException();
  //   return this.repo.save(hotel);
  // ===========================================================================
  async update(id: number, updateHotelDto: UpdateHotelDto): Promise<Hotel> {
    const result = await this.hotelsRepository.update(id, updateHotelDto);

    if (result?.affected === 0) {
      throw new NotFoundException(`Hotel with id ${id} not found`);
    }

    return this.findOne(id);
  }

  // [PARCIAL | NIVEL A: copiar literal] DELETE - mismo patron que en UserService (metodo 3/10).
  // delete(id) con el id "pelado"; el test verifica
  // expect(mockRepository.delete).toHaveBeenCalledWith(1)
  async delete(id: number): Promise<boolean> {
    const result = await this.hotelsRepository.delete(id);

    if (result?.affected === 0) {
      throw new NotFoundException(`Hotel with id ${id} not found`);
    }

    return true;
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] BUSQUEDA PARCIAL DE TEXTO con Like (metodo 4/10)
  // ---------------------------------------------------------------------------
  // Like(`%texto%`)  -> LIKE '%texto%'  (contiene)
  // Like(`texto%`)   -> empieza por     |  Like(`%texto`) -> termina en
  //
  // SENSIBILIDAD A MAYUSCULAS:
  //   Postgres -> ILike(`%${t}%`)  (import { ILike } from 'typeorm')
  //   SQLite   -> LIKE ya es insensible para ASCII, por eso usamos Like.
  //
  // BUSCAR EN VARIOS CAMPOS A LA VEZ: el array de where es un OR.
  //   where: [
  //     { location: Like(`%${t}%`) },
  //     { city:     Like(`%${t}%`) },
  //     { name:     Like(`%${t}%`) },
  //   ]
  // Dentro de UN objeto las condiciones se combinan con AND.
  // ===========================================================================
  async searchByLocation(location: string): Promise<Hotel[]> {
    return this.hotelsRepository.find({
      where: [
        { location: Like(`%${location}%`) },
        { city: Like(`%${location}%`) },
      ],
      relations: ['rooms'],
    });
  }

  // ===========================================================================
  // [PARCIAL | NIVEL B: copiar y ajustar] FILTRAR POR UNA CONDICION DE LA RELACION (metodo 5/10)
  // ---------------------------------------------------------------------------
  // Dos formas de resolver "hoteles que tengan al menos una habitacion libre":
  //
  // A) Filtrar en memoria (lo que hacemos aqui): traes todo con la relacion y
  //    filtras con JS. Simple y seguro, vale para volumenes pequenos.
  //
  // B) Filtrar en SQL con where anidado (mas eficiente):
  //      return this.hotelsRepository.find({
  //        where: { rooms: { available: true } },
  //        relations: ['rooms'],
  //      });
  //    OJO: esto tambien RECORTA hotel.rooms a solo las disponibles.
  //
  // C) QueryBuilder, cuando piden algo que find() no sabe hacer:
  //      return this.hotelsRepository
  //        .createQueryBuilder('hotel')
  //        .innerJoinAndSelect('hotel.rooms', 'room', 'room.available = :a', { a: true })
  //        .getMany();
  //
  // El '?? []' y el '?.' protegen de los mocks de los tests, donde find()
  // puede devolver undefined.
  // ===========================================================================
  async getAvailableHotels(): Promise<Hotel[]> {
    const hotels = await this.hotelsRepository.find({ relations: ['rooms'] });

    return (hotels ?? []).filter((hotel) =>
      hotel.rooms?.some((room) => room.available),
    );
  }
}
