import { useEffect, useRef, useCallback } from 'react';
import { useVoiceStore } from '../stores/voiceStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useVoice() {
  const voiceStore = useVoiceStore();
  const localStream = useRef<MediaStream | null>(null);
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioElements = useRef<Map<string, HTMLAudioElement>>(new Map());

  const createPeerConnection = useCallback(
    (peerId: string, channelId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Add local audio tracks
      localStream.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStream.current!);
      });

      // Forward ICE candidates
      pc.onicecandidate = (event) => {
        if (!event.candidate) return;
        const socket = getSocket();
        socket?.emit('voice:signal', {
          type: 'ice',
          to: peerId,
          channelId,
          data: event.candidate,
        } satisfies WsEvents.VoiceSignal);
      };

      // Handle remote audio stream
      pc.ontrack = (event) => {
        let audio = audioElements.current.get(peerId);
        if (!audio) {
          audio = new Audio();
          audio.autoplay = true;
          audioElements.current.set(peerId, audio);
        }
        audio.srcObject = event.streams[0];
      };

      // Speaking detection via AudioContext
      if (localStream.current && navigator.mediaDevices) {
        try {
          const ctx = new AudioContext();
          const src = ctx.createMediaStreamSource(event.streams?.[0] ?? localStream.current);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);

          const checkSpeaking = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            voiceStore.setSpeaking(peerId, avg > 20);
          };

          const interval = setInterval(checkSpeaking, 200);
          pc.addEventListener('connectionstatechange', () => {
            if (pc.connectionState === 'closed') clearInterval(interval);
          });
        } catch {}
      }

      peerConnections.current.set(peerId, pc);
      return pc;
    },
    [],
  );

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // When we receive the list of existing peers after joining
    const handleVoicePeers = async ({ channelId, peers }: WsEvents.VoicePeers) => {
      voiceStore.setParticipants(peers);
      for (const peer of peers) {
        const pc = createPeerConnection(peer.id, channelId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('voice:signal', { type: 'offer', to: peer.id, channelId, data: offer } satisfies WsEvents.VoiceSignal);
      }
    };

    // New peer joined the room after us
    const handlePeerJoined = ({ peer }: WsEvents.VoicePeerJoined) => {
      voiceStore.addParticipant(peer);
    };

    const handlePeerLeft = ({ peerId }: WsEvents.VoicePeerLeft) => {
      peerConnections.current.get(peerId)?.close();
      peerConnections.current.delete(peerId);
      const audio = audioElements.current.get(peerId);
      if (audio) { audio.srcObject = null; audioElements.current.delete(peerId); }
      voiceStore.removeParticipant(peerId);
    };

    const handleSignal = async ({ type, from, data }: WsEvents.VoiceSignalReceived) => {
      const channelId = voiceStore.channelId;
      if (!channelId) return;

      if (type === 'offer') {
        let pc = peerConnections.current.get(from);
        if (!pc) pc = createPeerConnection(from, channelId);
        await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('voice:signal', { type: 'answer', to: from, channelId, data: answer } satisfies WsEvents.VoiceSignal);
      } else if (type === 'answer') {
        const pc = peerConnections.current.get(from);
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(data as RTCSessionDescriptionInit));
      } else if (type === 'ice') {
        const pc = peerConnections.current.get(from);
        if (pc && data) await pc.addIceCandidate(new RTCIceCandidate(data as RTCIceCandidateInit));
      }
    };

    socket.on('voice:peers', handleVoicePeers);
    socket.on('voice:peer_joined', handlePeerJoined);
    socket.on('voice:peer_left', handlePeerLeft);
    socket.on('voice:signal', handleSignal);

    return () => {
      socket.off('voice:peers', handleVoicePeers);
      socket.off('voice:peer_joined', handlePeerJoined);
      socket.off('voice:peer_left', handlePeerLeft);
      socket.off('voice:signal', handleSignal);
    };
  }, []);

  const joinVoice = useCallback(async (channelId: string) => {
    try {
      localStream.current = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      voiceStore.join(channelId);
      const socket = getSocket();
      socket?.emit('voice:join', { channelId } satisfies WsEvents.VoiceJoin);
    } catch (err) {
      console.error('[Voice] Microphone access denied:', err);
      alert('Microphone access is required to join voice channels.');
    }
  }, []);

  const leaveVoice = useCallback(() => {
    const socket = getSocket();
    const { channelId } = voiceStore;

    if (channelId) socket?.emit('voice:leave', { channelId } satisfies WsEvents.VoiceLeave);

    localStream.current?.getTracks().forEach((t) => t.stop());
    localStream.current = null;
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
    audioElements.current.forEach((a) => { a.srcObject = null; });
    audioElements.current.clear();

    voiceStore.leave();
  }, []);

  const toggleMute = useCallback(() => {
    const track = localStream.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    voiceStore.setMuted(!track.enabled);
  }, []);

  const toggleDeafen = useCallback(() => {
    const deafened = !voiceStore.isDeafened;
    audioElements.current.forEach((audio) => { audio.muted = deafened; });
    voiceStore.setDeafened(deafened);
  }, [voiceStore.isDeafened]);

  return { joinVoice, leaveVoice, toggleMute, toggleDeafen };
}
