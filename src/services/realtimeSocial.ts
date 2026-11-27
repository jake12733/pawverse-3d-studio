import { PetConfig } from '../types';

export interface RemoteVisitor {
  id: string;
  nickname: string;
  shirtColor: string;
  hairColor: string;
  position: [number, number, number];
  rotationY: number;
  speechText: string | null;
  pet: PetConfig;
}

export interface SocialChatPayload {
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

/**
 * Cleanly decoupled realtime multiplayer interface.
 * Swap LocalSimulatedSocialAdapter with Supabase Realtime / Firebase / WebSocket
 * by implementing these 5 methods without touching any 3D scene components.
 */
export interface RealtimeSocialAdapter {
  readonly mode: 'local-sim' | 'websocket';
  connect(localUser: { id: string; nickname: string }): void;
  disconnect(): void;
  broadcastPlayerMove(position: [number, number, number], rotationY: number): void;
  sendChat(text: string, onReply?: (msg: SocialChatPayload, visitorId: string) => void): void;
  getVisitors(): RemoteVisitor[];
}

const nowTime = () =>
  new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

const INITIAL_VISITORS: RemoteVisitor[] = [
  {
    id: 'visitor-jimin',
    nickname: '지민',
    shirtColor: '#3b82f6',
    hairColor: '#1e1b18',
    position: [-4.4, 0, -1.8],
    rotationY: 0.7,
    speechText: null,
    pet: {
      name: '초코',
      breed: 'retriever',
      furColor: '#7A4F35',
      eyeColor: '#1F1A17',
      outfit: 'none',
      hat: 'none',
      eyewear: 'none',
      collar: 'led_collar',
      customGlbUrl: null
    }
  },
  {
    id: 'visitor-suhyun',
    nickname: '수현',
    shirtColor: '#ec4899',
    hairColor: '#3f2a1d',
    position: [4.6, 0, -2.6],
    rotationY: -0.9,
    speechText: null,
    pet: {
      name: '모찌',
      breed: 'cat',
      furColor: '#F6F4EE',
      eyeColor: '#2563EB',
      outfit: 'royal_hanbok',
      hat: 'none',
      eyewear: 'none',
      collar: 'none',
      customGlbUrl: null
    }
  },
  {
    id: 'visitor-taeo',
    nickname: '태오',
    shirtColor: '#10b981',
    hairColor: '#27272a',
    position: [2.2, 0, 4.8],
    rotationY: -2.4,
    speechText: null,
    pet: {
      name: '두부',
      breed: 'corgi',
      furColor: '#D98245',
      eyeColor: '#1F1A17',
      outfit: 'tartan_dress',
      hat: 'crown',
      eyewear: 'none',
      collar: 'none',
      customGlbUrl: null
    }
  }
];

export class LocalSimulatedSocialAdapter implements RealtimeSocialAdapter {
  readonly mode = 'local-sim' as const;
  private visitors: RemoteVisitor[] = structuredClone(INITIAL_VISITORS);
  private connected = false;

  connect(): void {
    this.connected = true;
  }

  disconnect(): void {
    this.connected = false;
  }

  broadcastPlayerMove(): void {
    // Local simulation does not require network emit
  }

  getVisitors(): RemoteVisitor[] {
    return this.visitors;
  }

  sendChat(text: string, onReply?: (msg: SocialChatPayload, visitorId: string) => void): void {
    if (!this.connected || !onReply) return;

    const lower = text.toLowerCase();
    let chosen = this.visitors[Math.floor(Math.random() * this.visitors.length)];
    let reply = '';

    if (lower.includes('안녕') || lower.includes('하이') || lower.includes('반가')) {
      chosen = this.visitors[0];
      reply = `안녕하세요! 오늘 광장 날씨 너무 좋죠? 우리 ${chosen.pet.name}도 인사해요 🐾`;
    } else if (lower.includes('강아지') || lower.includes('고양이') || lower.includes('귀여')) {
      chosen = this.visitors[1];
      reply = `감사해요! ${chosen.pet.name}가 칭찬 듣고 꼬리를 엄청 흔드네요 ❤️`;
    } else if (lower.includes('산책') || lower.includes('놀자') || lower.includes('같이')) {
      chosen = this.visitors[2];
      reply = `좋아요! 분수대 쪽으로 같이 산책해요! 보물상자도 찾아봐요 🎁`;
    } else if (lower.includes('꾸미기') || lower.includes('방') || lower.includes('인테리어')) {
      chosen = this.visitors[1];
      reply = `펫 하우스 꾸미기 재밌죠! 밥그릇이랑 펫 베드 놓아두면 애들이 진짜 좋아해요 🏠`;
    } else {
      const pool = [
        `오 맞아요! 우리 ${chosen.pet.name}도 방금 신나서 뛰어다녔어요 ✨`,
        `광장에서 다 같이 모이니까 진짜 메타버스 같네요! 반가워요 👋`,
        `잠시 후 런웨이 패션쇼도 구경 가실래요? 의상 너무 예쁘던데요!`
      ];
      reply = pool[Math.floor(Math.random() * pool.length)];
    }

    setTimeout(() => {
      onReply(
        {
          senderId: chosen.id,
          senderName: `${chosen.nickname} (${chosen.pet.name} 집사)`,
          text: reply,
          timestamp: nowTime()
        },
        chosen.id
      );
    }, 950);
  }
}

/**
 * Ready-to-wire WebSocket adapter stub for future backend / Supabase / Socket.IO integration.
 */
export class WebSocketSocialAdapter implements RealtimeSocialAdapter {
  readonly mode = 'websocket' as const;
  private socket: WebSocket | null = null;
  private endpoint: string;
  private visitors: RemoteVisitor[] = [];

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  connect(localUser: { id: string; nickname: string }): void {
    try {
      this.socket = new WebSocket(this.endpoint);
      this.socket.onopen = () => {
        this.socket?.send(JSON.stringify({ type: 'join', user: localUser }));
      };
    } catch {
      this.socket = null;
    }
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  broadcastPlayerMove(position: [number, number, number], rotationY: number): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'move', position, rotationY }));
    }
  }

  sendChat(text: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'chat', text }));
    }
  }

  getVisitors(): RemoteVisitor[] {
    return this.visitors;
  }
}

export const socialAdapter: RealtimeSocialAdapter = new LocalSimulatedSocialAdapter();
