import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Client, ClientGrpc, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Metadata } from '@grpc/grpc-js';
import { Observable, lastValueFrom } from 'rxjs';

export interface Order {
  id: string;
  account_id: string;
  asset_id: string;
  quantity: number;
  status: string;
}

interface OrderGrpcClient {
  createOrder(
    data: {
      account_id: string;
      asset_id: string;
      quantity: number;
    },
    metadata?: Metadata,
  ): Observable<{ order: Order }>;
  findAllOrders(
    data: { account_id: string },
    metadata?: Metadata,
  ): Observable<{ orders: Order[] }>;
  findOneOrder(
    data: { id: string },
    metadata?: Metadata,
  ): Observable<{ order: Order }>;
}

@Injectable()
export class OrdersService implements OnModuleInit {
  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'fullcycle',
      protoPath: [join(__dirname, 'orders', 'proto', 'orders.proto')],
      loader: { keepCase: true },
    },
  })
  clientGrpc: ClientGrpc;
  orderGrpcClient: OrderGrpcClient;

  onModuleInit() {
    this.orderGrpcClient =
      this.clientGrpc.getService<OrderGrpcClient>('OrderService');
  }

  create(createOrderDto: CreateOrderDto) {
    return lastValueFrom(this.orderGrpcClient.createOrder(createOrderDto));
  }

  findAll(account_id: string) {
    const metadata = new Metadata();
    metadata.set('authorization', 'Bearer 1234');
    return lastValueFrom(
      this.orderGrpcClient.findAllOrders({ account_id }, metadata),
    );
  }

  findOne(id: string) {
    return lastValueFrom(this.orderGrpcClient.findOneOrder({ id }));
  }

  // update(id: string, updateOrderDto: UpdateOrderDto) {
  //   return `This action updates a #${id} order`;
  // }

  // remove(id: string) {
  //   return `This action removes a #${id} order`;
  // }
}
