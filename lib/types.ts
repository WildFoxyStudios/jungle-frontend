// ─────────────────────────────────────────────────────────────────────────────
// Shared domain types for the red-social frontend
// Keep in sync with the Rust backend models.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Primitives / Shared ─────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: string;
  has_more: boolean;
}

export interface MessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
}

// ─── User / Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  bio?: string;
  profile_picture_url?: string;
  cover_photo_url?: string;
  role?: "user" | "moderator" | "admin" | "verified" | "banned";
  email_verified?: boolean;
  location_city?: string;
  location_country?: string;
  website?: string;
  birth_date?: string;
  gender?: string;
  relationship_status?: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  session_token: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface LoginPayload {
  email_or_username: string;
  password: string;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface UserProfile extends User {
  work_current?: string;
  work_position?: string;
  education_current?: string;
  languages?: string[];
  phone_number?: string;
  profile_views_count?: number;
}

export interface Education {
  id: string;
  user_id: string;
  school_name: string;
  degree?: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
  is_current: boolean;
  description?: string;
  created_at: string;
}

export interface Work {
  id: string;
  user_id: string;
  company_name: string;
  position: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  created_at: string;
}

export interface PlaceLived {
  id: string;
  user_id: string;
  city: string;
  country: string;
  place_type: string;
  start_year?: number;
  end_year?: number;
  created_at: string;
}

export interface Interest {
  id: string;
  user_id: string;
  category: string;
  interest_name: string;
  created_at: string;
}

export interface ProfileStats {
  friends_count: number;
  posts_count: number;
  photos_count: number;
  profile_views_count: number;
}

export interface CompleteProfile {
  user: UserProfile;
  stats: ProfileStats;
  photos: UserPhoto[];
  education: Education[];
  work: Work[];
  places_lived: PlaceLived[];
  interests: Interest[];
}

export interface UserPhoto {
  id: string;
  user_id: string;
  album_id?: string;
  url: string;
  caption?: string;
  description?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export type Visibility = "public" | "friends" | "only_me" | "custom";

export interface Post {
  id: string;
  user_id: string;
  user_name?: string;
  user_profile_picture?: string;
  group_id?: string;
  page_id?: string;
  event_id?: string;
  content?: string;
  media_urls?: string[];
  location?: string;
  location_lat?: number;
  location_lng?: number;
  feeling?: string;
  activity?: string;
  tagged_users?: string[];
  background_color?: string;
  visibility: Visibility;
  is_pinned: boolean;
  is_archived: boolean;
  is_hidden?: boolean;
  shares_count: number;
  reactions_count: number;
  comments_count: number;
  likes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePostPayload {
  content?: string;
  media_urls?: string[];
  location?: string;
  location_lat?: number;
  location_lng?: number;
  feeling?: string;
  activity?: string;
  tagged_users?: string[];
  background_color?: string;
  visibility?: Visibility;
  group_id?: string;
  page_id?: string;
  event_id?: string;
}

export interface UpdatePostPayload {
  content?: string;
  location?: string;
  feeling?: string;
  activity?: string;
  tagged_users?: string[];
  visibility?: Visibility;
}

// ─── Reactions ───────────────────────────────────────────────────────────────

export type ReactionType =
  | "like"
  | "love"
  | "haha"
  | "wow"
  | "sad"
  | "angry"
  | "care";

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: ReactionType;
  created_at: string;
}

export interface ReactionSummary {
  total: number;
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  care: number;
}

export interface ReactionListItem {
  user_id: string;
  username: string;
  profile_picture_url?: string;
  reaction_type: ReactionType;
  created_at: string;
}

// ─── Comments ────────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name?: string;
  user_picture?: string;
  parent_comment_id?: string;
  content: string;
  media_url?: string;
  gif_url?: string;
  reactions_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCommentPayload {
  content: string;
  parent_comment_id?: string;
  media_url?: string;
  gif_url?: string;
}

// ─── Shares ──────────────────────────────────────────────────────────────────

export interface Share {
  id: string;
  post_id: string;
  user_id: string;
  username?: string;
  profile_picture_url?: string;
  shared_with_comment?: string;
  original_post_id?: string;
  visibility: Visibility;
  shared_at: string;
}

// ─── Stories ─────────────────────────────────────────────────────────────────

export interface Story {
  id: string;
  user_id: string;
  user_name?: string;
  user_picture?: string;
  media_url: string;
  media_type: string;
  text_content?: string;
  background_color?: string;
  duration: number;
  views_count: number;
  visibility: string;
  has_viewed?: boolean;
  expires_at: string;
  created_at: string;
}

export interface CreateStoryPayload {
  media_url?: string;
  media_type?: string;
  text_content?: string;
  background_color?: string;
  duration?: number;
  visibility?: string;
}

export interface StoryViewer {
  viewer_id: string;
  viewer_name: string;
  viewer_picture?: string;
  viewed_at: string;
}

export interface StoryHighlight {
  id: string;
  user_id: string;
  title: string;
  cover_image_url?: string;
  display_order: number;
  created_at: string;
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface Friend {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  mutual_friends_count?: number;
  friendship_id?: string;
  friendship_status?: FriendshipStatus;
  created_at: string;
}

export interface FriendSuggestion {
  id: string;
  suggested_user_id?: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  reason?: string;
  mutual_friends_count?: number;
  score?: number;
}

export interface FriendStats {
  pending_requests: number;
  friends_count: number;
  suggestions_count: number;
}

export interface FriendList {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  members_count: number;
  created_at: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string;
  actor_name?: string;
  actor_username?: string;
  actor_picture?: string;
  notification_type: string;
  entity_type?: string;
  entity_id?: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

export interface NotificationStats {
  unread_count: number;
  total_count: number;
}

export interface NotificationPreferences {
  id?: string;
  user_id?: string;
  email_friend_requests: boolean;
  email_post_interactions: boolean;
  email_comments: boolean;
  email_tags: boolean;
  email_events: boolean;
  push_friend_requests: boolean;
  push_post_interactions: boolean;
  push_comments: boolean;
  push_tags: boolean;
  push_events: boolean;
  push_messages: boolean;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  user_agent?: string;
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  name?: string;
  is_group: boolean;
  created_by: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  participants?: ConversationParticipant[];
  is_muted?: boolean;
  created_at: string;
}

export interface ConversationParticipant {
  user_id: string;
  user_name: string;
  user_picture?: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name?: string;
  sender_picture?: string;
  content?: string;
  message_type: string;
  media_url?: string;
  reply_to_id?: string;
  is_edited: boolean;
  deleted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SendMessagePayload {
  content?: string;
  message_type?: string;
  media_url?: string;
  reply_to_id?: string;
}

export interface CreateConversationPayload {
  participant_ids: string[];
  is_group?: boolean;
  name?: string;
}

// ─── Groups ──────────────────────────────────────────────────────────────────

export type GroupPrivacy = "public" | "private" | "secret";
export type MemberRole = "admin" | "moderator" | "member" | "pending";

export interface Group {
  id: string;
  name: string;
  description?: string;
  picture_url?: string;
  cover_url?: string;
  privacy: GroupPrivacy;
  created_by: string;
  members_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  username?: string;
  full_name?: string;
  profile_picture_url?: string;
  role: MemberRole;
  joined_at: string;
}

export interface GroupPost {
  id: string;
  group_id: string;
  author_id: string;
  author_name?: string;
  author_picture?: string;
  content: string;
  media_urls?: string[];
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventType = "public" | "private" | "friends";
export type RsvpStatus = "going" | "interested" | "not_going";

export interface Event {
  id: string;
  creator_id: string;
  creator_name?: string;
  name: string;
  description?: string;
  event_type: EventType;
  cover_url?: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  start_time: string;
  end_time?: string;
  is_online: boolean;
  online_link?: string;
  going_count: number;
  interested_count: number;
  user_rsvp?: RsvpStatus;
  created_at: string;
  updated_at?: string;
}

export interface EventAttendee {
  user_id: string;
  user_name?: string;
  user_picture?: string;
  rsvp_status: RsvpStatus;
  responded_at: string;
}

// ─── Marketplace ─────────────────────────────────────────────────────────────

export type ProductCondition =
  | "new"
  | "like_new"
  | "good"
  | "fair"
  | "poor";
export type ProductStatus = "available" | "pending" | "sold" | "deleted";

export interface MarketplaceProduct {
  id: string;
  seller_id: string;
  seller_name?: string;
  seller_picture?: string;
  category_id?: string;
  category_name?: string;
  title: string;
  description?: string;
  price: number;
  currency: string;
  condition: ProductCondition;
  location?: string;
  status: ProductStatus;
  images?: string[];
  stock?: number;
  rating?: number;
  reviews_count?: number;
  created_at: string;
}

export interface MarketplaceOffer {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  offered_price: number;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "withdrawn";
  created_at: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  icon?: string;
}

// ─── Pages ───────────────────────────────────────────────────────────────────

export type PageCategory =
  | "local_business"
  | "company"
  | "brand"
  | "artist"
  | "public_figure"
  | "entertainment"
  | "cause"
  | "community"
  | "sports"
  | "other";

export interface Page {
  id: string;
  name: string;
  username?: string;
  category?: PageCategory;
  description?: string;
  about?: string;
  picture_url?: string;
  cover_url?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  created_by: string;
  followers_count: number;
  likes_count: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface PagePost {
  id: string;
  page_id: string;
  author_id: string;
  content?: string;
  media_urls?: string[];
  link_url?: string;
  is_published: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  scheduled_at?: string;
  created_at: string;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResults {
  posts: SearchPost[];
  users: SearchUser[];
  groups: SearchGroup[];
  pages: SearchPage[];
  products: SearchProduct[];
  events: SearchEvent[];
  total: number;
}

export interface SearchPost {
  id: string;
  content: string;
  user_id: string;
  user_name: string;
  created_at: string;
}

export interface SearchUser {
  id: string;
  username: string;
  full_name: string;
  profile_picture?: string;
  bio?: string;
}

export interface SearchGroup {
  id: string;
  name: string;
  description?: string;
  privacy: string;
  member_count: number;
}

export interface SearchPage {
  id: string;
  name: string;
  description?: string;
  category: string;
  likes_count: number;
}

export interface SearchProduct {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  rating?: number;
}

export interface SearchEvent {
  id: string;
  name: string;
  location?: string;
  start_time: string;
  event_type: string;
}

export interface TrendingSearch {
  query: string;
  daily_count: number;
  weekly_count: number;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface UserSettings {
  id?: string;
  user_id?: string;
  profile_visibility: string;
  search_visibility: string;
  online_status_visible: boolean;
  show_active_status: boolean;
  who_can_send_requests: string;
  who_can_message: string;
  who_can_see_friends: string;
  who_can_see_posts: string;
  who_can_comment: string;
  who_can_tag: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  theme: string;
  language: string;
  timezone: string;
  two_factor_enabled: boolean;
  login_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LoginSession {
  id: string;
  user_id: string;
  device_name?: string;
  device_type?: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  is_active: boolean;
  last_active: string;
  created_at: string;
}

// ─── Security / 2FA ──────────────────────────────────────────────────────────

export interface TwoFactorSetup {
  qr_code_url: string;
  secret: string;
  backup_codes: string[];
}

export interface TwoFactorVerifyPayload {
  code: string;
}

export interface BackupCodes {
  backup_codes: string[];
}

// ─── Reels ───────────────────────────────────────────────────────────────────

export interface Reel {
  id: string;
  user_id: string;
  username?: string;
  profile_picture_url?: string;
  video_url: string;
  thumbnail_url?: string;
  caption?: string;
  duration: number;
  width?: number;
  height?: number;
  audio_url?: string;
  audio_name?: string;
  filter_name?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_public: boolean;
  allow_comments: boolean;
  created_at: string;
}

export interface ReelComment {
  id: string;
  reel_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  likes_count: number;
  replies_count: number;
  created_at: string;
}

// ─── Watch / Videos ──────────────────────────────────────────────────────────

export interface WatchVideo {
  id: string;
  user_id: string;
  username?: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  category?: string;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  is_public: boolean;
  allow_comments: boolean;
  is_trending: boolean;
  created_at: string;
  published_at?: string;
}

// ─── Albums & Photos ─────────────────────────────────────────────────────────

export interface Album {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  cover_photo_id?: string;
  privacy: string;
  photos_count: number;
  is_system_album: boolean;
  album_type?: string;
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  album_id?: string;
  url: string;
  caption?: string;
  description?: string;
  location?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

// ─── Hashtags ────────────────────────────────────────────────────────────────

export interface Hashtag {
  id: string;
  name: string;
  normalized_name: string;
  usage_count: number;
  created_at: string;
  last_used_at: string;
}

export interface TrendingHashtag {
  id: string;
  hashtag_id: string;
  name: string;
  usage_count_24h: number;
  usage_count_7d: number;
  trend_score: number;
}

// ─── Collections (Saved Posts) ───────────────────────────────────────────────

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  icon?: string;
  is_private: boolean;
  items_count: number;
  created_at: string;
  updated_at: string;
}

export interface SavedPost {
  id: string;
  post_id: string;
  collection_id?: string;
  collection_name?: string;
  saved_at: string;
}

// ─── Polls ───────────────────────────────────────────────────────────────────

export interface PollOptionWithVotes {
  id: string;
  option_text: string;
  votes_count: number;
  percentage: number;
  option_order: number;
}

export interface PollWithOptions {
  id: string;
  post_id: string;
  question: string;
  allows_multiple_answers: boolean;
  closes_at?: string;
  total_votes: number;
  options: PollOptionWithVotes[];
  user_votes: string[];
  created_at: string;
}

// ─── Feed ────────────────────────────────────────────────────────────────────

export type FeedItemType = "Post" | "Reel" | "WatchVideo";

export interface FeedItem {
  type: FeedItemType;
  id: string;
  user_id: string;
  username: string;
  score: number;
  created_at: string;
  // Post-specific
  content?: string;
  media_urls?: string[];
  likes_count?: number;
  comments_count?: number;
  // Reel-specific
  caption?: string;
  video_url?: string;
  views_count?: number;
  // WatchVideo-specific
  title?: string;
  description?: string;
}

export interface FeedPreferences {
  posts_weight: number;
  reels_weight: number;
  videos_weight: number;
  stories_weight: number;
  memories_weight: number;
  friends_weight: number;
  pages_weight: number;
  groups_weight: number;
  show_suggested: boolean;
  chronological_mode: boolean;
}

// ─── Memories ────────────────────────────────────────────────────────────────

export interface MemoryWithPost {
  id: string;
  post_id: string;
  years_ago: number;
  original_date: string;
  is_viewed: boolean;
  post_content?: string;
  post_media_urls?: string[];
  post_created_at: string;
}

export interface MemoryPreferences {
  id: string;
  user_id: string;
  enabled: boolean;
  show_notifications: boolean;
  min_years_ago: number;
  excluded_dates: string[];
  excluded_people: string[];
  created_at: string;
  updated_at: string;
}

// ─── Fundraisers ─────────────────────────────────────────────────────────────

export interface Fundraiser {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  story?: string;
  category_id?: string;
  goal_amount: number;
  raised_amount: number;
  currency: string;
  donations_count: number;
  status: string;
  beneficiary_type?: string;
  created_at: string;
  updated_at?: string;
}

export interface Donation {
  id: string;
  fundraiser_id: string;
  donor_id: string;
  amount: number;
  is_anonymous: boolean;
  message?: string;
  payment_method?: string;
  payment_status: string;
  created_at: string;
}

export interface FundraiserUpdate {
  id: string;
  fundraiser_id: string;
  user_id: string;
  content: string;
  media_urls?: string[];
  created_at: string;
}

export interface FundraiserCategory {
  id: string;
  name: string;
  icon?: string;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export interface JobPosting {
  id: string;
  user_id: string;
  page_id?: string;
  title: string;
  description: string;
  category_id?: string;
  location?: string;
  city?: string;
  country?: string;
  is_remote: boolean;
  employment_type?: string;
  experience_level?: string;
  salary_min?: number;
  salary_max?: number;
  show_salary: boolean;
  status: string;
  views_count: number;
  applications_count?: number;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  user_id: string;
  cover_letter?: string;
  resume_url?: string;
  status: string;
  notes?: string;
  created_at: string;
}

export interface JobApplicant {
  application_id: string;
  job_id: string;
  user_id: string;
  username: string;
  full_name: string;
  profile_picture_url?: string;
  cover_letter?: string;
  resume_url?: string;
  status: string;
  notes?: string;
  applied_at: string;
}

export interface JobCategory {
  id: string;
  name: string;
  icon?: string;
}

// ─── GIF ─────────────────────────────────────────────────────────────────────

export interface GifResult {
  id: string;
  url: string;
  preview_url: string;
  title: string;
  width: number;
  height: number;
  source: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface PageAnalytics {
  date: string;
  page_views: number;
  unique_visitors: number;
  new_likes: number;
  post_engagements: number;
  reactions: number;
  comments: number;
  shares: number;
}

export interface PostAnalytics {
  organic_reach: number;
  viral_reach: number;
  total_reach: number;
  organic_impressions: number;
  viral_impressions: number;
  total_impressions: number;
  engaged_users: number;
  clicks: number;
  video_views: number;
  video_avg_time_watched: number;
}

export interface AnalyticsSummary {
  total_reach: number;
  total_engagement: number;
  total_followers: number;
  growth_rate: number;
  top_post?: {
    id: string;
    content: string;
    reach: number;
    engagement: number;
  };
  recent_activity: Array<{
    event_type: string;
    count: number;
    date: string;
  }>;
}

// ─── WebRTC / Calls ──────────────────────────────────────────────────────────

export type CallType = "audio" | "video";
export type CallStatus = "ringing" | "active" | "ended" | "rejected" | "missed";

export interface Call {
  id: string;
  caller_id: string;
  receiver_id: string;
  call_type: CallType;
  status: CallStatus;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration?: number;
  created_at: string;
}

export interface CallWithUsers extends Call {
  caller_name: string;
  receiver_name: string;
}

export interface WebRTCConfig {
  iceServers: Array<{
    urls: string;
    username?: string;
    credential?: string;
  }>;
}

// ─── Group Calls ─────────────────────────────────────────────────────────────

export interface GroupCall {
  id: string;
  room_id: string;
  creator_id: string;
  group_id?: string;
  conversation_id?: string;
  call_type: string;
  status: string;
  max_participants: number;
  started_at: string;
}

export interface GroupCallParticipant {
  id: string;
  user_id: string;
  username: string;
  profile_picture_url?: string;
  is_audio_enabled: boolean;
  is_video_enabled: boolean;
  is_screen_sharing: boolean;
  joined_at: string;
}

// ─── Live Streaming ──────────────────────────────────────────────────────────

export type StreamStatus = "scheduled" | "live" | "ended";

export interface LiveStream {
  id: string;
  streamer_id: string;
  streamer_name?: string;
  streamer_picture?: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  stream_key?: string;
  rtmp_url?: string;
  hls_url?: string;
  status: StreamStatus;
  viewers_count: number;
  peak_viewers: number;
  scheduled_start?: string;
  started_at?: string;
  ended_at?: string;
  duration?: number;
  created_at: string;
}

export interface StreamComment {
  id: string;
  stream_id: string;
  user_id: string;
  user_name?: string;
  user_picture?: string;
  content: string;
  created_at: string;
}

// ─── Cart / Orders ───────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  product_image_url?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  total_items: number;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  subtotal: number;
  shipping_cost: number;
  tax: number;
  total: number;
  created_at: string;
}

export interface OrderDetail extends Order {
  payment_method?: string;
  shipping_address: string;
  tracking_number?: string;
  items: Array<{
    product_id: string;
    product_name: string;
    product_image_url?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  user_picture?: string;
  rating: number;
  title?: string;
  review_text?: string;
  verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  images: string[];
  created_at: string;
}

export interface ReviewSummary {
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
}

// ─── Scheduled Posts ─────────────────────────────────────────────────────────

export interface ScheduledPost {
  id: string;
  user_id: string;
  content_type: "post" | "story" | "reel";
  content: string;
  media_urls?: string[];
  scheduled_for: string;
  status: "pending" | "published" | "failed" | "cancelled";
  created_at: string;
}

// ─── Premium / Boosts ────────────────────────────────────────────────────────

export interface BoostedPost {
  id: string;
  post_id: string;
  budget: number;
  duration_days: number;
  status: string;
  impressions: number;
  clicks: number;
  spent_amount: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  subscriber_id: string;
  creator_id: string;
  tier: string;
  status: string;
  started_at: string;
  expires_at?: string;
}

export interface SubscriptionTier {
  id: string;
  name: string;
  description?: string;
  price: number;
  benefits: string[];
}

// ─── Social Features ─────────────────────────────────────────────────────────

export interface Poke {
  id: string;
  poker_id: string;
  poked_id: string;
  is_mutual: boolean;
  poked_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  place_name: string;
  latitude?: number;
  longitude?: number;
  post_id?: string;
  created_at: string;
}

// ─── Moderation ──────────────────────────────────────────────────────────────

export interface ModerationReport {
  id: string;
  content_type: string;
  content_id: string;
  reporter_id?: string;
  reason?: string;
  action_taken?: string;
  created_at: string;
}

// ─── Upload ──────────────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
  content_type: string;
  size: number;
}

// ─── Avatar / Media Filters ──────────────────────────────────────────────────

export interface Avatar {
  id: string;
  user_id: string;
  avatar_url: string;
  style: string;
  created_at: string;
  updated_at: string;
}

export interface MediaFilter {
  id: string;
  name: string;
  preview_url?: string;
  css_filter?: string;
  usage_count: number;
}
