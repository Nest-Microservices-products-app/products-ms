import { BadRequestException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/pagination/dtos/pagination-dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('Product Service')
  
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected')
  }
  
  
  async create(createProductDto: CreateProductDto) {

    const product = await this.product.create({
      data : createProductDto
    })

    return product;
  }

  async findAll( pagiantionDto : PaginationDto ) {

    const { page, limit } = pagiantionDto;


    const count = await this.product.count({
      where : { available : true }
    });
    const lastPage = Math.ceil( count / limit )


    const products = await this.product.findMany({
      where : { available : true},
      skip : (page - 1) * limit ,
      take : limit
    });

    return {
      data : products,
      meta : {
        total : count,
        page : page,
        lastPage : lastPage
      }
    }

  }

  async findOne(id: number) {
    const product = await this.product.findFirst({
      where : { id, available : true }
    });

    if(!product) throw new RpcException({
      status : HttpStatus.BAD_REQUEST,
      message : 'Product not exist'
    })

    return product
  }

  async update(id: number, updateProductDto: UpdateProductDto) {

    const { id:_, ...data } = updateProductDto

    const product = await this.findOne(id);

    const updatedProduct = await this.product.update({
      where : { id : product.id },
      data : { ...data }
    })

    return updatedProduct
  }

  async remove(id: number) {

     await this.findOne(id);

    // await this.product.deleteMany({
    //   where : { id : product.id }
    // })

    const product = await this.product.update({
      where : { id },
      data : { available : false }
    })

    return product;
  }

  async validateProducts( ids : number[]){

    ids = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where : { 
        id : { in : ids },
        available : true
      }
    })

    if(ids.length !== products.length){
      throw new RpcException({
        message : 'Some products were not found',
        status : HttpStatus.BAD_REQUEST
      })
    }

    return products;

  }
}
