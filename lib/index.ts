/**
 * lib/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Central barrel export for the entire API layer.
 *
 * Import from "@/lib" instead of individual files:
 *
 *   import { postsApi, feedApi, useApi } from "@/lib"
 *   import type { Post, User, FeedItem } from "@/lib"
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Core client (Axios instance + token helpers + auth API) ──────────────────
export { api, authApi, tokenStorage, API_BASE_URL, WS_BASE_URL } from "./api";

// ── Error utilities ───────────────────────────────────────────────────────────
export {
  getErrorMessage,
  parseError,
  isNotFound,
  isAuthError,
  isValidationError,
  isNetworkError,
} from "./errors";
export type { ApiError } from "./errors";

// ── Server-side fetch helper (Server Components / Route Handlers) ─────────────
export {
  serverFetch,
  serverApi,
  cachedFetch,
  freshFetch,
  isServerFetchError,
} from "./api-server";
export type { ServerFetchOptions, ServerFetchError } from "./api-server";

// ── Environment config ────────────────────────────────────────────────────────
export { env } from "./env";

// ── Shared utilities ──────────────────────────────────────────────────────────
export { cn } from "./utils";

// ── Domain types (single canonical source: lib/types.ts) ─────────────────────
export type {
  // Primitives
  PaginatedResponse,
  MessageResponse,
  ErrorResponse,
  Visibility,
  ReactionType,
  FriendshipStatus,
  GroupPrivacy,
  MemberRole,
  EventType,
  RsvpStatus,
  ProductCondition,
  ProductStatus,
  PageCategory,
  CallType,
  CallStatus,
  StreamStatus,
  FeedItemType,
  // Auth
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  // Profile
  UserProfile,
  UserPhoto,
  Education,
  Work,
  PlaceLived,
  Interest,
  ProfileStats,
  CompleteProfile,
  // Posts
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  // Reactions
  PostReaction,
  ReactionSummary,
  ReactionListItem,
  // Comments
  Comment,
  CreateCommentPayload,
  // Shares
  Share,
  // Stories
  Story,
  CreateStoryPayload,
  StoryViewer,
  StoryHighlight,
  // Friends
  Friend,
  FriendSuggestion,
  FriendStats,
  FriendList,
  // Notifications
  Notification,
  NotificationStats,
  NotificationPreferences,
  PushSubscriptionPayload,
  // Messaging
  Conversation,
  ConversationParticipant,
  Message,
  SendMessagePayload,
  CreateConversationPayload,
  // Groups
  Group,
  GroupMember,
  GroupPost,
  // Events
  Event,
  EventAttendee,
  // Marketplace
  MarketplaceProduct,
  MarketplaceOffer,
  MarketplaceCategory,
  // Pages
  Page,
  PagePost,
  // Search
  SearchResults,
  SearchPost,
  SearchUser,
  SearchGroup,
  SearchPage,
  SearchProduct,
  SearchEvent,
  TrendingSearch,
  // Settings
  UserSettings,
  LoginSession,
  // Security / 2FA
  TwoFactorSetup,
  TwoFactorVerifyPayload,
  BackupCodes,
  // Reels
  Reel,
  ReelComment,
  // Watch
  WatchVideo,
  // Albums & Photos
  Album,
  Photo,
  // Hashtags
  Hashtag,
  TrendingHashtag,
  // Collections
  Collection,
  SavedPost,
  // Polls
  PollWithOptions,
  PollOptionWithVotes,
  // Feed
  FeedItem,
  FeedPreferences,
  // Memories
  MemoryWithPost,
  MemoryPreferences,
  // Fundraisers
  Fundraiser,
  Donation,
  FundraiserUpdate,
  FundraiserCategory,
  // Jobs
  JobPosting,
  JobApplication,
  JobApplicant,
  JobCategory,
  // GIF
  GifResult,
  // Analytics
  PageAnalytics,
  PostAnalytics,
  AnalyticsSummary,
  // WebRTC / Calls
  Call,
  CallWithUsers,
  WebRTCConfig,
  GroupCall,
  GroupCallParticipant,
  // Streaming
  LiveStream,
  StreamComment,
  // Cart / Orders
  CartItem,
  Cart,
  Order,
  OrderDetail,
  // Reviews
  ProductReview,
  ReviewSummary,
  // Scheduled Posts
  ScheduledPost,
  // Premium
  BoostedPost,
  Subscription,
  SubscriptionTier,
  // Social
  Poke,
  CheckIn,
  // Moderation
  ModerationReport,
  // Upload
  UploadResponse,
  // Avatar / Filters
  Avatar,
  MediaFilter,
} from "./types";

// ── Albums & Photos ───────────────────────────────────────────────────────────
export { albumsApi } from "./api-albums";

// ── Analytics ─────────────────────────────────────────────────────────────────
export { analyticsApi } from "./api-analytics";

// ── Cart ──────────────────────────────────────────────────────────────────────
export { cartApi } from "./api-cart";

// ── Collections (saved posts) ─────────────────────────────────────────────────
export { collectionsApi } from "./api-collections";

// ── Events ────────────────────────────────────────────────────────────────────
export { eventsApi } from "./api-events";

// ── Feed ──────────────────────────────────────────────────────────────────────
export { feedApi } from "./api-feed";

// ── Friends ───────────────────────────────────────────────────────────────────
export { friendsApi } from "./api-friends";

// ── Fundraisers ───────────────────────────────────────────────────────────────
export { fundraisersApi } from "./api-fundraisers";

// ── GIFs ──────────────────────────────────────────────────────────────────────
export { gifsApi } from "./api-gifs";

// ── Groups ────────────────────────────────────────────────────────────────────
export { groupsApi } from "./api-groups";

// ── Hashtags ──────────────────────────────────────────────────────────────────
export { hashtagsApi } from "./api-hashtags";

// ── Jobs ──────────────────────────────────────────────────────────────────────
export { jobsApi } from "./api-jobs";

// ── Marketplace ───────────────────────────────────────────────────────────────
export { marketplaceApi } from "./api-marketplace";

// ── Memories ──────────────────────────────────────────────────────────────────
export { memoriesApi } from "./api-memories";

// ── Messages / Conversations ──────────────────────────────────────────────────
export { conversationsApi, messagesApi } from "./api-messages";

// ── Notifications ─────────────────────────────────────────────────────────────
export { notificationsApi } from "./api-notifications";

// ── Orders ────────────────────────────────────────────────────────────────────
export { ordersApi } from "./api-orders";

// ── Pages ─────────────────────────────────────────────────────────────────────
export { pagesApi } from "./api-pages";

// ── Polls ─────────────────────────────────────────────────────────────────────
export { pollsApi } from "./api-polls";

// ── Posts · Reactions · Comments · Shares ────────────────────────────────────
export { postsApi, reactionsApi, commentsApi, sharesApi } from "./api-posts";

// ── Premium: Boosts & Creator Subscriptions ───────────────────────────────────
export { boostsApi, subscriptionsApi, tiersApi } from "./api-premium";

// ── Profile ───────────────────────────────────────────────────────────────────
export { profileApi } from "./api-profile";

// ── Reels ─────────────────────────────────────────────────────────────────────
export { reelsApi } from "./api-reels";

// ── Reviews ───────────────────────────────────────────────────────────────────
export { reviewsApi } from "./api-reviews";

// ── Scheduled Posts ───────────────────────────────────────────────────────────
export { scheduledApi } from "./api-scheduled";

// ── Search ────────────────────────────────────────────────────────────────────
export { searchApi } from "./api-search";

// ── Security (2FA · sessions · GDPR · privacy) ───────────────────────────────
export { securityApi } from "./api-security";

// ── Settings ──────────────────────────────────────────────────────────────────
export { settingsApi } from "./api-settings";

// ── Social features (pokes · close-friends · check-ins · etc.) ───────────────
export {
  pokesApi,
  closeFriendsApi,
  acquaintancesApi,
  checkInsApi,
  birthdaysApi,
  mutualFriendsApi,
  blockApi,
  savedSearchesApi,
} from "./api-social";

// ── Stories + Highlights ──────────────────────────────────────────────────────
export { storiesApi } from "./api-stories";

// ── Streaming (live video) ────────────────────────────────────────────────────
export { streamingApi } from "./api-streaming";

// ── Upload ────────────────────────────────────────────────────────────────────
export { uploadApi, validateFile, readFileAsDataURL } from "./api-upload";

// ── Watch (long-form videos) ──────────────────────────────────────────────────
export { watchApi } from "./api-watch";

// ── WebRTC: 1-to-1 calls · group calls · signaling socket ────────────────────
export { callsApi, groupCallsApi, createSignalingSocket } from "./api-webrtc";
