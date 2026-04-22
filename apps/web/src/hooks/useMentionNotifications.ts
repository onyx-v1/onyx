import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from './useSocket';
import { useSocketStore } from '../stores/socketStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useChannelStore } from '../stores/channelStore';
import { platform } from '../platform';
import { WsEvents } from '@onyx/types';

/**
 * Listens for mention:notification events and:
 *  1. Queues in-app toast alerts (existing behaviour)
 *  2. Fires a native OS notification when the app is not focused
 *     — Electron: Windows Action Center toast (click to jump to channel)
 *     — Browser:  Web Notifications API (with permission)
 */
export function useMentionNotifications() {
  const connectionId    = useSocketStore((s) => s.connectionId);
  const addAlert        = useNotificationsStore((s) => s.addAlert);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);
  const navigate        = useNavigate();

  // Wire up the notification-click → navigate handler once on mount
  useEffect(() => {
    platform.onNotificationClick((channelId) => {
      navigate(`/channels/${channelId}`);
    });
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handle = ({ channelId, fromUser, content, isEveryone }: WsEvents.MentionNotification) => {
      // Always queue the in-app alert
      if (channelId !== activeChannelId) {
        addAlert({ channelId, fromUser: fromUser.displayName, content, isEveryone });
      }

      // Fire native notification when:
      //  • app is hidden / minimised (document not visible), OR
      //  • user is in a different channel
      const appUnfocused = document.visibilityState !== 'visible';
      const inOtherChannel = channelId !== activeChannelId;

      if (appUnfocused || inOtherChannel) {
        const title = isEveryone
          ? `@everyone in #${channelId}`
          : `${fromUser.displayName} mentioned you`;

        platform.showNotification({
          title,
          body: content.length > 100 ? content.slice(0, 97) + '…' : content,
          channelId,
        });
      }
    };

    socket.on('mention:notification', handle);
    return () => { socket.off('mention:notification', handle); };
  }, [connectionId, activeChannelId]);
}
