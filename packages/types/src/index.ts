// ─── Core Entities ────────────────────────────────────────────────────────────

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
  createdAt: string | Date;
}

export interface Channel {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE';
  position: number;
  communityId: string;
  private?: boolean;
}

export interface Message {
  id: string;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  channelId: string;
  replyTo?: {
    id: string;
    content: string;
    author: {
      id: string;
      username: string;
      displayName: string;
      avatarUrl?: string | null;
    };
    deleted?: boolean;
  } | null;
  createdAt: string | Date;
  deleted: boolean;
  pinned?: boolean;
  reactions?: { emoji: string; userId: string }[];
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
  export interface ReactionToggle { messageId: string; emoji: string; }
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
  export interface MessageUpdated { message: Message; }
  export interface ReactionUpdated {
    messageId: string;
    channelId: string;
    reactions: { emoji: string; userId: string }[];
  }
  export interface MessagePinned {
    messageId: string;
    channelId: string;
    pinnedBy: { id: string; displayName: string };
    pinned: boolean;  // true = pinned, false = unpinned
  }
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
