import { useEffect } from 'react';
import { getSocket } from './useSocket';
import { useSocketStore } from '../stores/socketStore';
import { useChannelStore } from '../stores/channelStore';
import { useMessageStore } from '../stores/messageStore';
import { WsEvents } from '@onyx/types';

/**
 * Global message sink — runs in AppShell for the lifetime of the session.
 *
 * Responsibilities:
 *  1. Store EVERY incoming message in messageStore (regardless of active channel)
 *     so navigating to a channel that received messages while you were away
 *     shows them immediately without a re-fetch.
 *  2. Increment the unread badge only for channels that are NOT currently active.
 *  3. Track @mention badges.
 */
export function useUnreadTracker() {
  const connectionId = useSocketStore((s) => s.connectionId);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessage = ({ message }: WsEvents.MessageNew) => {
      const { activeChannelId, incrementUnread } = useChannelStore.getState();

      // Always cache the message — deduplication in addMessage prevents doubles
      // when useMessages also fires for the currently-active channel.
      useMessageStore.getState().addMessage(message.channelId, message);

      // Only flag as unread when the user isn't already looking at that channel
      if (message.channelId !== activeChannelId) {
        incrementUnread(message.channelId);
      }
    };

    const onMention = ({ channelId }: WsEvents.MentionNotification) => {
      useChannelStore.getState().addMention(channelId);
    };

    socket.on('message:new',          onMessage);
    socket.on('mention:notification', onMention);

    return () => {
      socket.off('message:new',          onMessage);
      socket.off('mention:notification', onMention);
    };
  }, [connectionId]);
}
