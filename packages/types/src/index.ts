// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string | Date;
}

export interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  position: number;
  communityId: string;
}

export interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
  channelId: string;
  replyTo?: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
      displayName: string;
    };
  } | null;
  createdAt: string | Date;
  deleted: boolean;
}

export interface Community {
  id: string;
  name: string;
  channels: Channel[];
}

export interface VoiceParticipant {
  id: string;
  displayName: string;
  isMuted: boolean;
  isSpeaking?: boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// ─── Socket.IO Events ─────────────────────────────────────────────────────────

export namespace WsEvents {
  // Client → Server
  export interface ChannelJoin { channelId: string; }
  export interface ChannelLeave { channelId: string; }
  export interface MessageSend { channelId: string; content: string; replyToId?: string; }
  export interface MessageDelete { messageId: string; }
  export interface TypingStart { channelId: string; }
  export interface TypingStop { channelId: string; }
  export interface VoiceJoin { channelId: string; }
  export interface VoiceLeave { channelId: string; }
  export interface VoiceSignal {
    type: 'offer' | 'answer' | 'ice';
    to: string;        // target userId
    channelId: string;
    data: unknown;     // RTCSessionDescription | RTCIceCandidate
  }

  // Server → Client
  export interface MessageNew { message: Message; }
  export interface MessageDeleted { messageId: string; channelId: string; }
  export interface TypingUpdate {
    channelId: string;
    users: Array<{ id: string; displayName: string; }>;
  }
  export interface PresenceUpdate { userId: string; online: boolean; }
  export interface PresenceInit { onlineUserIds: string[]; }
  export interface VoicePeers {
    channelId: string;
    peers: Array<{ id: string; displayName: string; isMuted: boolean; }>;
  }
  export interface VoicePeerJoined {
    channelId: string;
    peer: { id: string; displayName: string; };
  }
  export interface VoicePeerLeft { channelId: string; peerId: string; }
  export interface VoiceSignalReceived {
    type: 'offer' | 'answer' | 'ice';
    from: string;
    data: unknown;
  }
  export interface MentionNotification {
    messageId: string;
    channelId: string;
    fromUser: { displayName: string };
    content: string;       // first 100 chars preview
    isEveryone: boolean;
  }
}
