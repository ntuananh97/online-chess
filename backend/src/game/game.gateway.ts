import { BadRequestException, UsePipes, ValidationPipe } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';
import { LeaveRoomDto } from './dto/leave-room.dto';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }),
)
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  handleConnection(client: Socket): void {
    void client;
  }

  handleDisconnect(client: Socket) {
    const result = this.gameService.handleDisconnect(client.id);
    if (result?.opponentSocketId) {
      this.server.to(result.opponentSocketId).emit('opponent_disconnected', {
        roomId: result.roomId,
      });
    }
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: CreateRoomDto,
  ) {
    try {
      const { roomId } = this.gameService.createRoom(client.id, dto);
      await client.join(roomId);
      client.emit('room_created', { roomId, color: 'white' as const });
    } catch (err) {
      this.emitClientError(client, err);
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: JoinRoomDto,
  ) {
    try {
      const payload = this.gameService.joinRoom(client.id, dto);
      await client.join(dto.roomId);
      this.server.to(dto.roomId).emit('game_ready', payload);
    } catch (err) {
      this.emitClientError(client, err);
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: LeaveRoomDto,
  ) {
    try {
      const { roomId, opponentSocketId } = this.gameService.leaveRoom(
        client.id,
        dto.roomId,
      );
      await client.leave(roomId);
      if (opponentSocketId) {
        this.server.to(opponentSocketId).emit('opponent_left', { roomId });
      }
    } catch (err) {
      this.emitClientError(client, err);
    }
  }

  private emitClientError(client: Socket, err: unknown): void {
    let message = 'Bad request';
    if (err instanceof WsException) {
      const inner = err.getError();
      message = typeof inner === 'string' ? inner : message;
    } else if (err instanceof BadRequestException) {
      const res = err.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object' && 'message' in res) {
        const m = (res as { message: string | string[] }).message;
        message = Array.isArray(m)
          ? m.join(', ')
          : typeof m === 'string'
            ? m
            : message;
      }
    }
    client.emit('error', { message });
  }
}
