/**
 * Central permission helper — single source of truth for all role checks.
 * Import this instead of comparing role strings directly in controllers/gateway.
 */

export type AppRole = 'ADMIN' | 'MODERATOR' | 'MEMBER';

export const can = {
  /** Delete any user's message (Mod+ can moderate chat) */
  deleteAnyMessage: (role: AppRole) => role === 'ADMIN' || role === 'MODERATOR',

  /** Pin / unpin messages (Admin only) */
  pinMessage: (role: AppRole) => role === 'ADMIN',

  /** Create, rename, delete channels */
  manageChannels: (role: AppRole) => role === 'ADMIN',

  /** See private channels (hidden from regular members) */
  accessPrivateChannels: (role: AppRole) => role === 'ADMIN' || role === 'MODERATOR',

  /** Kick a member from the server session */
  kickFromServer: (role: AppRole) => role === 'ADMIN' || role === 'MODERATOR',

  /** Mute another user in a voice channel */
  muteInVoice: (role: AppRole) => role === 'ADMIN' || role === 'MODERATOR',

  /** Force-remove a user from a voice channel */
  kickFromVoice: (role: AppRole) => role === 'ADMIN' || role === 'MODERATOR',

  /** Assign or revoke the Moderator role */
  assignModerator: (role: AppRole) => role === 'ADMIN',

  /** Access the Server Settings panel */
  accessServerSettings: (role: AppRole) => role === 'ADMIN' || role === 'MODERATOR',
};
