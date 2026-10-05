import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { HotelService } from './hotel.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { Hotel } from './hotel.entity';

@Controller('hotels')
export class HotelController {
  constructor(private readonly hotelService: HotelService) {}

  @Post()
  async createHotel(@Body() createHotelDto: CreateHotelDto): Promise<Hotel> {
    return this.hotelService.create(createHotelDto);
  }

  @Get()
  async getAllHotels(): Promise<Hotel[]> {
    return this.hotelService.findAll();
  }

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] ParseIntPipe: convierte el param a number Y valida
  // ---------------------------------------------------------------------------
  //   @Param('id', ParseIntPipe) id: number
  //
  // Ventaja sobre parseInt(id): si llega /hotels/abc, parseInt da NaN y la
  // consulta falla con un 500 feo; ParseIntPipe devuelve un 400 limpio
  // ("Validation failed (numeric string is expected)").
  //
  // OTROS PIPES UTILES:
  //   @Param('id', ParseUUIDPipe)                      -> valida uuid
  //   @Query('activo', ParseBoolPipe)                  -> "true" -> true
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe)  -> valor por defecto
  // ===========================================================================
  @Get(':id')
  async getHotel(@Param('id', ParseIntPipe) id: number): Promise<Hotel> {
    return this.hotelService.findOne(id);
  }

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] ENDPOINT 1/5 - PUT (actualizar)
  // ---------------------------------------------------------------------------
  // PLANTILLA COPIABLE:
  //   @Put(':id')
  //   async update(
  //     @Param('id', ParseIntPipe) id: number,
  //     @Body() dto: UpdateXDto,
  //   ) { return this.xService.update(id, dto); }
  //
  // PUT vs PATCH (lo preguntan): PUT reemplaza el recurso entero, PATCH lo
  // actualiza parcialmente. En la practica con UpdateDto+PartialType los dos
  // se implementan igual; usa el verbo que pida el enunciado.
  //
  // El controller NO lleva logica: valida/convierte y delega en el service.
  // El 404 lo lanza el service y Nest lo traduce solo a la respuesta HTTP.
  // ===========================================================================
  @Put(':id')
  async updateHotel(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHotelDto: UpdateHotelDto,
  ): Promise<Hotel> {
    return this.hotelService.update(id, updateHotelDto);
  }

  // ===========================================================================
  // [PARCIAL | NIVEL A: copiar literal] ENDPOINT 2/5 - DELETE
  // ---------------------------------------------------------------------------
  // Por defecto DELETE devuelve 200 con el body que retornes.
  // Si el enunciado pide 204 No Content:
  //   @Delete(':id')
  //   @HttpCode(HttpStatus.NO_CONTENT)      // import de '@nestjs/common'
  //   async remove(@Param('id', ParseIntPipe) id: number): Promise<void> { ... }
  // ===========================================================================
  @Delete(':id')
  async deleteHotel(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const success = await this.hotelService.delete(id);
    return { success };
  }
}
