import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
import { CreateRoomDto } from './dto/create-room.dto';
import { JoinRoomDto } from './dto/join-room.dto';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

type RoomStatus = 'waiting' | 'in_progress';

interface RoomState {
  roomId: string;
  whiteSocketId: string;
  whiteGuestId: string;
  whiteNickname: string;
  blackSocketId: string | null;
  blackGuestId: string | null;
  blackNickname: string | null;
  status: RoomStatus;
  initialTime: number;
  increment: number;
}

interface SocketMeta {
  guestId: string;
  nickname: string;
  roomId: string | null;
}

export interface GameReadyPayload {
  roomId: string;
  fen: string;
  whiteNickname: string;
  blackNickname: string;
}

@Injectable()
export class GameService {
  private readonly rooms = new Map<string, RoomState>();
  private readonly sockets = new Map<string, SocketMeta>();

  generateRoomId(): string {
    return randomUUID();
  }

  createRoom(socketId: string, dto: CreateRoomDto): { roomId: string } {
    this.ensureSocketFree(socketId);

    const initialTime = dto.initialTime ?? 600;
    const increment = dto.increment ?? 0;

    const roomId = this.generateRoomId();
    const room: RoomState = {
      roomId,
      whiteSocketId: socketId,
      whiteGuestId: dto.guestId,
      whiteNickname: dto.nickname,
      blackSocketId: null,
      blackGuestId: null,
      blackNickname: null,
      status: 'waiting',
      initialTime,
      increment,
    };

    this.rooms.set(roomId, room);
    this.sockets.set(socketId, {
      guestId: dto.guestId,
      nickname: dto.nickname,
      roomId,
    });

    return { roomId };
  }

  joinRoom(socketId: string, dto: JoinRoomDto): GameReadyPayload {
    this.ensureSocketFree(socketId);

    const room = this.rooms.get(dto.roomId);
    if (!room) {
      throw new WsException('Room not found');
    }
    if (room.status !== 'waiting' || room.blackSocketId !== null) {
      throw new WsException('Room is not available to join');
    }
    if (room.whiteGuestId === dto.guestId) {
      throw new WsException('Cannot join your own room');
    }

    room.blackSocketId = socketId;
    room.blackGuestId = dto.guestId;
    room.blackNickname = dto.nickname;
    room.status = 'in_progress';

    this.sockets.set(socketId, {
      guestId: dto.guestId,
      nickname: dto.nickname,
      roomId: dto.roomId,
    });

    return {
      roomId: dto.roomId,
      fen: STARTING_FEN,
      whiteNickname: room.whiteNickname,
      blackNickname: room.blackNickname ?? dto.nickname,
    };
  }

  leaveRoom(
    socketId: string,
    roomId: string,
  ): { roomId: string; opponentSocketId: string | null } {
    const meta = this.sockets.get(socketId);
    if (!meta?.roomId || meta.roomId !== roomId) {
      throw new WsException('Not in this room');
    }

    const tear = this.tearDownParticipant(socketId);
    return {
      roomId: tear.roomId,
      opponentSocketId: tear.opponentSocketId,
    };
  }

  handleDisconnect(socketId: string): {
    roomId: string;
    opponentSocketId: string | null;
  } | null {
    const meta = this.sockets.get(socketId);
    if (!meta?.roomId) {
      this.sockets.delete(socketId);
      return null;
    }

    return this.tearDownParticipant(socketId);
  }

  getSocketInfo(socketId: string): SocketMeta | undefined {
    return this.sockets.get(socketId);
  }

  private ensureSocketFree(socketId: string): void {
    const existing = this.sockets.get(socketId);
    if (existing?.roomId) {
      throw new WsException('Already in a room');
    }
  }

  private tearDownParticipant(socketId: string): {
    roomId: string;
    opponentSocketId: string | null;
  } {
    const meta = this.sockets.get(socketId);
    if (!meta?.roomId) {
      this.sockets.delete(socketId);
      return { roomId: '', opponentSocketId: null };
    }

    const roomId = meta.roomId;
    const room = this.rooms.get(roomId);

    let opponentSocketId: string | null = null;
    if (room) {
      if (room.whiteSocketId === socketId) {
        opponentSocketId = room.blackSocketId;
      } else if (room.blackSocketId === socketId) {
        opponentSocketId = room.whiteSocketId;
      }
      this.rooms.delete(roomId);
    }

    this.sockets.delete(socketId);

    if (opponentSocketId) {
      const opponent = this.sockets.get(opponentSocketId);
      if (opponent) {
        opponent.roomId = null;
      }
    }

    return { roomId, opponentSocketId };
  }
}
