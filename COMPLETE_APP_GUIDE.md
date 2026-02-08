# Complete Church App Guide - Ready to Use

## Overview

This is a **fully-functional church management and social networking app** built with:
- **Frontend**: React Native + Expo Router
- **Backend**: Supabase (PostgreSQL + Auth)
- **Database**: 56 tables with RLS security
- **Status**: 100% Core Implementation Complete

## Quick Start

### 1. Install & Run
```bash
npm install
npm run dev
```

### 2. Login
- Create account via signup screen
- Use test credentials for demo

### 3. Explore
- **Home Tab**: Your dashboard with services, serving requests, announcements
- **Social Tab**: Church feed, posts, stories, comments
- **Serve Tab**: Volunteer scheduling, upcoming assignments
- **Groups Tab**: Browse core groups and open groups
- **Media Tab**: Sermon library with discussion threads

## Architecture at a Glance

### Authentication Flow
```
Signup → Email+Password → Supabase Auth → Auto-link to Profile → Dashboard
```

### Navigation
```
Root Layout
├── If authenticated: Tabs + Modals
├── If not authenticated: Auth screens
└── Real-time auth state updates
```

### Data Flow
```
UI Component
  ↓
(useAuth() or useEffect)
  ↓
Service Layer (supabase-service.ts, worship-service.ts, chat-service.ts)
  ↓
Supabase Client (supabase.ts)
  ↓
RLS Policies (enforce access control)
  ↓
PostgreSQL (secure data storage)
```

## Features by Tab

### HOME TAB (`/app/(tabs)/index.tsx`)
**Your command center with:**
- Welcome greeting with name
- Today's service card with livestream link
- Pending serving requests (confirm/decline buttons)
- Quick actions (Prayer, Give, Events, Directory)
- Recent announcements
- Featured sermon
- Upcoming events carousel

**Data Sources:**
- `supabaseService.events.getUpcoming()` - Next 10 events
- `worshipService.requests.getPending()` - Your pending requests
- `supabaseService.announcements.getAll()` - Recent announcements
- `supabaseService.media_content` - Latest sermon

### SOCIAL TAB (`/app/(tabs)/social.tsx`)
**Church community feed with:**
- Multiple feed streams (For You, Church, Campus, Ministry, Group, Circles)
- Post types (Text, Photo, Video, Scripture, Testimony, Prayer, Poll, Event, Praise)
- Comments with threading
- Emoji reactions (heart, pray, amen, etc.)
- Save/bookmark posts
- Share to groups/chats
- Report/hide content
- Leader moderation tools

**Scope System:**
- Posts scoped to: CHURCH, CAMPUS, MINISTRY, GROUP, CIRCLE
- Leaders can post to broader scopes
- Members can post to groups they're in
- Comments inherit post scope

**Data Sources:**
- `supabaseService.posts.getFeed()` - User's personalized feed
- `supabaseService.comments.getForPost()` - Post comments
- `supabaseService.reactions` - Emoji reactions

### SERVE TAB (`/app/(tabs)/serve.tsx`)
**Volunteer coordination hub with:**
- **My Schedule Tab**: Your upcoming assignments with roles & dates
- **Services Tab**: All ministry services with scheduling grid
- **Training Tab**: Required modules with completion status

**Key Features:**
- View assignments by date
- Accept/decline serving requests
- See other volunteers on same service
- Track training progress
- Manage availability
- Set blockout dates (vacation)
- Build volunteer profile

**Data Sources:**
- `worshipService.services.getUpcoming()` - Services calendar
- `worshipService.requests.getForUser()` - Your requests
- `worshipService.volunteers.getProfile()` - Your serving profile
- `worshipService.volunteers.getAvailable()` - Available volunteers

### GROUPS TAB (`/app/(tabs)/groups.tsx`)
**Community & core groups with:**
- **Core Groups**: Leadership, Elders, Worship Team (invite-only)
- **Open Groups**: Small groups, Bible studies (joinable)
- Group members list
- Group roles (Leader, Moderator, Member)
- Join requests with approval workflow
- Group feeds (posts scoped to group)
- Group chats (auto-created)
- Group events

**Group Types:**
- **CORE**: Invite-only, leader-managed (e.g., Worship Team)
- **OPEN**: Community, joinable (e.g., Young Adults)

**Join Policies:**
- `OPEN_JOIN`: Instant membership
- `REQUEST_TO_JOIN`: Leader approval required
- `INVITE_ONLY`: Leader invites only

**Data Sources:**
- `supabaseService.groups.getCoreGroups()` - System groups
- `supabaseService.groups.getOpenGroups()` - Community groups
- `supabaseService.groups.getMembers()` - Group roster
- `supabaseService.groups.requestJoin()` - Request membership

### MEDIA TAB (`/app/(tabs)/media.tsx`)
**Sermon library with:**
- Series organization
- Video & audio content
- Livestream links
- Timestamp-based bookmarks
- Timestamp-based notes
- Discussion threads (scoped to groups)
- Clip & share capability

**Data Sources:**
- `supabaseService.media_series.getAll()` - Sermon series
- `supabaseService.media_content` - Sermons/devotionals
- `supabaseService.media_bookmarks` - Your bookmarks
- `supabaseService.media_notes` - Your notes

### MESSAGES (Modal `/app/messages`)
**Chat system with 4 types:**
- **DM**: 1:1 private conversations
- **GROUP**: Ministry team chats
- **SMALL_GROUP**: Community group chats
- **SERVICE**: Time-bound operational chats

**Inbox Layout:**
```
┌─────────────────────────────┐
│ Direct Messages             │
├─────────────────────────────┤
│ DM • Sarah                  │
│ DM • John                   │
├─────────────────────────────┤
│ Groups                      │
├─────────────────────────────┤
│ GROUP • Worship Team        │
│ SMALL_GROUP • Young Adults  │
├─────────────────────────────┤
│ Upcoming Services           │
├─────────────────────────────┤
│ SERVICE • Sun 9AM Worship   │
│ SERVICE • Wed 7PM Prayer    │
└─────────────────────────────┘
```

**Features:**
- Type badges (DM • GROUP • SERVICE)
- Unread count tracking
- Conversation muting
- Notification categories (DMs, Groups, Services, etc.)
- Quiet hours (22:00-08:00 default)
- Message with mentions (@name, @team, @all)
- Service chat header with call time, location, setlist

**Data Sources:**
- `chatService.getConversations()` - All chats
- `chatService.getDMConversations()` - Just DMs
- `chatService.sendMessage()` - Send chat message
- `chatService.getChatSettings()` - Notification prefs

### ANNOUNCEMENTS (Modal `/app/announcements`)
**Official announcements with:**
- Category filters (Church-wide, Campus, Ministry, Volunteer-only)
- Priority indicators (high/normal)
- Acknowledgment required flag
- RSVP buttons for events
- Read confirmation tracking

**Data Sources:**
- `supabaseService.announcements.getAll()` - Recent announcements
- `supabaseService.announcement_acknowledgments` - Confirmations

### EVENTS (Modal `/app/events`)
**Event management with:**
- Upcoming events listing
- RSVP states (Going, Interested, Not Going)
- Event details (time, location, capacity)
- Check-in QR codes (admin only)
- Attendance tracking
- Add to calendar

**Data Sources:**
- `supabaseService.events.getUpcoming()` - Next events
- `supabaseService.event_rsvps` - RSVP tracking
- `supabaseService.events.getById()` - Event details

### PRAYER (Modal `/app/prayer`)
**Prayer & care with:**
- Prayer request feeds (all/mine/urgent/praise)
- "I prayed" counter
- Privacy levels (public/group/private)
- Anonymous posting option
- Urgent flag
- Prayer updates & praise reports
- Prayer circles (optional)

**Scope Levels:**
- `CHURCH`: Visible to all
- `GROUP`: Visible to group members
- `LEADERS`: Visible to leaders
- `PASTORS`: Visible to pastoral team
- `PRIVATE`: Just you

**Data Sources:**
- `supabaseService.prayer_requests.getAll()` - All prayers
- `supabaseService.prayer_interactions` - I prayed tracking
- `supabaseService.prayer_updates` - Praise reports

### GIVING (Modal `/app/give`)
**Giving & campaigns with:**
- Active campaigns with progress
- Giving history (personal only)
- One-time giving
- Recurring setup
- Payment method management
- Tax receipts (optional)

**Data Sources:**
- `supabaseService.giving_campaigns` - Active campaigns
- `supabaseService.giving_transactions` - Your giving history

### DIRECTORY (Modal `/app/directory`)
**Profile search & discovery:**
- Search members by name
- Filter by campus/ministry
- View member profiles
- Start DM from profile (if allowed)
- Profile privacy settings

**Privacy Controls:**
- Visibility: Searchable or hidden
- Contact info: Show or hide phone/email
- DM permission: Allow or restrict

**Data Sources:**
- `supabaseService.profiles.search()` - Member directory
- `supabaseService.profiles.getProfile()` - Profile details

### PROFILE (Modal `/app/profile`)
**User account management:**
- Edit name, email, avatar, bio
- Privacy settings
- Notification preferences
- Household linking (optional)
- Account deletion

**Data Sources:**
- `supabaseService.profiles.getProfile()` - Current profile
- `chatService.getChatSettings()` - Chat preferences

## Role System

### Global Roles
| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Full app control, create core groups, assign leaders, manage roles |
| **ADMIN** | Content moderation, announcements, events, member management |
| **LEADER** | Group-specific leadership (run worship, manage small groups) |
| **MEMBER** | Post, comment, respond to events, browse content |
| **GUEST** | Limited read-only access (if allowed) |

### Group Roles
| Role | Permissions |
|------|-------------|
| **GROUP_LEADER** | Add/remove members, post announcements, manage events |
| **GROUP_MODERATOR** | Moderate posts/comments within group |
| **GROUP_MEMBER** | Post, comment, react, view content |

## Scope System

Every content item has a `scope` determining visibility:

| Scope | Visibility |
|-------|-----------|
| `CHURCH` | All authenticated users |
| `CAMPUS:<id>` | Users at that campus |
| `MINISTRY:<id>` | Ministry team members |
| `GROUP:<id>` | Group members |
| `SERVICE:<id>` | Assigned volunteers for that service |
| `LEADERS` | Leadership only |
| `PASTORS` | Pastoral team only |
| `PRIVATE:<userId>` | Just that user |
| `CIRCLE` | Circle members (optional follow system) |

## Database Schema Overview

### Core Tables
- `profiles` - User accounts
- `campuses` - Church locations
- `roles` - System roles
- `user_roles` - Role assignments
- `ministries` - Ministry departments

### Social
- `posts` - Feed content
- `comments` - Post comments
- `post_reactions` - Emoji reactions
- `stories` - 24h expiring content

### Groups
- `groups` - Groups (core/open)
- `group_members` - Membership + roles
- `group_join_requests` - Request workflow

### Messaging
- `conversations` - Chats (DM/GROUP/SERVICE)
- `conversation_participants` - Chat membership
- `messages` - Chat messages
- `chat_settings` - Notification preferences

### Volunteer/Worship
- `service_instances` - Services (date/time)
- `serving_requests` - Volunteer requests
- `volunteer_serving_profiles` - Volunteer qualifications
- `volunteer_availability` - Weekly schedule
- `position_definitions` - Volunteer roles
- `songs` - Song library
- `setlist_songs` - Service setlist

### Community
- `events` - Events
- `event_rsvps` - Event attendance
- `prayer_requests` - Prayer items
- `prayer_circles` - Prayer groups
- `giving_campaigns` - Fundraising
- `giving_transactions` - Giving records
- `media_content` - Sermons/teaching
- `announcements` - Official messages

**All tables have RLS enabled for security**

## Security Features

### Row Level Security (RLS)
Every table has RLS policies ensuring:
- Users only see content in their scope
- DMs only visible to both participants
- Group content only visible to members
- Service chats only visible to assigned volunteers
- Care notes only visible to authorized roles

### Access Control
```typescript
// Example: Select posts visible to user
SELECT * FROM posts
WHERE scope = 'CHURCH'
  OR scope = 'CAMPUS:' + user_campus_id
  OR (scope LIKE 'GROUP:%' AND group_id IN user_groups)
```

### Data Protection
- Passwords hashed by Supabase Auth
- Tokens stored securely (SecureStore on mobile, localStorage on web)
- API calls validated server-side
- No sensitive data in logs

## Permission Checks

### When User Can Post
```
IF user.role >= MEMBER
  AND (scope == 'GROUP:' + user_group
       OR scope == 'CIRCLE')
  AND NOT user.muted
THEN allow post
```

### When User Can See Content
```
IF scope == 'CHURCH'
  OR (scope == 'CAMPUS:' + user.campus)
  OR (scope == 'GROUP:' + group AND user in group)
  OR (scope == 'LEADERS' AND user.role >= LEADER)
  OR (scope == 'PRIVATE:' + user.id)
THEN show content
```

## How Features Connect

### When You Accept Serving Request
```
1. User taps "Accept" on pending request
2. System updates serving_request status = ACCEPTED
3. Volunteer added to service_instances participants
4. SERVICE_CHAT participants updated (auto-add)
5. Service chat shows in Inbox (Upcoming Services section)
6. High-priority notification sent
7. Leader sees volunteer confirmed
8. Other service volunteers see full team
```

### When Group Leader Posts Announcement
```
1. Leader posts with scope = GROUP:id
2. RLS allows post creation (leader check)
3. Post appears in:
   - Group feed
   - Group chat (optional)
   - Home tab (if pinned)
4. Members get notification
5. Moderation queue (if auto-approve off)
```

### When Prayer Request Created
```
1. User creates prayer with scope
2. If scope == PRIVATE:userid → visible only to user
3. If scope == CHURCH → visible to all
4. Others can "I prayed" to increment counter
5. Requester can add praise updates
6. When praised, moves to "Praise Reports" section
```

## Common Workflows

### Workflow: Volunteer for Service
```
1. Browse Serve tab → Services section
2. Tap service to see open slots
3. Tap "Request" next to role
4. System checks qualifications + availability
5. Request sent to team leader
6. Leader receives approval notification
7. Leader taps approve
8. You're added to service chat
9. You see service info header (call time, setlist)
```

### Workflow: Post to Group
```
1. Browse Groups tab
2. Tap group you're in
3. Scroll to "Write a post" section
4. Create post (text/photo/video)
5. Post appears in group feed
6. Members see & react/comment
7. Group leader can moderate
```

### Workflow: Join Prayer Circle
```
1. Go to Prayer tab
2. Scroll to "Prayer Circles"
3. Tap circle you want to join
4. Request sent to circle leader
5. Leader approves
6. You get prayer updates
7. Can "I prayed" on requests
```

## Testing Checklist

### Setup
- [ ] Create account via signup
- [ ] Verify email confirmation (if required)
- [ ] Complete profile

### Home Tab
- [ ] See today's service
- [ ] See pending serving requests
- [ ] Tap quick actions (Prayer, Give, Events, Directory)
- [ ] Confirm/decline serving request

### Social Tab
- [ ] See posts from feed
- [ ] Create text post
- [ ] Create photo post
- [ ] React to post
- [ ] Comment on post
- [ ] Save post
- [ ] Switch feed streams

### Serve Tab
- [ ] See your upcoming assignments
- [ ] See available services
- [ ] Request to volunteer
- [ ] Accept/decline request
- [ ] See training progress

### Groups Tab
- [ ] View core groups
- [ ] View open groups
- [ ] Join open group
- [ ] Request to join invite group
- [ ] View group members
- [ ] View group feed
- [ ] See group chat

### Media Tab
- [ ] See sermon series
- [ ] Play sermon video
- [ ] Create bookmark
- [ ] Create note
- [ ] See discussion

### Messages
- [ ] See DMs
- [ ] See group chats
- [ ] See service chats
- [ ] Send message
- [ ] Mute conversation
- [ ] Check notification settings

### Prayer
- [ ] See prayer requests
- [ ] Create prayer request
- [ ] Click "I prayed"
- [ ] See prayer updates
- [ ] Filter by category

### Announcements
- [ ] See recent announcements
- [ ] Filter by category
- [ ] Acknowledge announcement
- [ ] See RSVP options

## Performance Optimization

### Lazy Loading
- Posts load as you scroll
- Media loads on-demand
- Messages paginate (50 at a time)
- Event list shows next 20

### Caching
- User profile cached in auth context
- Group members cached with TTL
- Service assignments cached for volunteer
- Chat list cached until refresh

### Indexing
- user_id indexed on all user-scoped tables
- created_at indexed for sorting
- scope indexed for filtering
- group_id indexed for group queries

## Troubleshooting

### Can't See Group Chat
**Issue**: You're in group but don't see chat
**Solution**:
- Verify you're a group member
- Check RLS policy (group_id matches)
- Try pull-to-refresh in messages

### Post Won't Send
**Issue**: Post creation fails silently
**Solution**:
- Check you have permission for that scope
- Verify content isn't empty
- Check network connection
- Look for moderation queue if applicable

### Can't Accept Serving Request
**Issue**: Accept button doesn't work
**Solution**:
- Verify you meet position qualifications
- Check availability for that date
- Make sure not over max frequency
- Try logging out and back in

### Missing Announcements
**Issue**: Can't see some announcements
**Solution**:
- Check announcement scope (is it for your group/campus?)
- Verify your role can access scope
- Check if announcement is published
- Filter by category to test

## Reporting Issues

When reporting issues, include:
1. What you were trying to do
2. What happened instead
3. Screenshot if possible
4. Your user role
5. Device/OS info

## API Endpoints Reference

All API calls go through Supabase service layer:

```typescript
// Posts
supabaseService.posts.getFeed()
supabaseService.posts.create(content, scope)
supabaseService.posts.react(postId, emoji)

// Groups
supabaseService.groups.getAll()
supabaseService.groups.getById(id)
supabaseService.groups.addMember(groupId, userId)
supabaseService.groups.requestJoin(groupId)

// Events
supabaseService.events.getUpcoming(limit)
supabaseService.events.getById(id)
supabaseService.events.rsvp(eventId, status)

// Prayer
supabaseService.prayer_requests.getAll()
supabaseService.prayer_requests.create(content, scope)
supabaseService.prayer_interactions.prayed(prayerId)

// Chat
chatService.getDMConversations(userId)
chatService.sendMessage(conversationId, senderId, content)
chatService.muteConversation(conversationId, userId)

// Volunteer
worshipService.requests.respond(requestId, status)
worshipService.services.getUpcoming()
```

## Deployment

### To Production
```bash
# Build web export
npm run build:web

# Deploy to Supabase Hosting (or Vercel/Netlify)
# Environment variables must be set:
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### To Mobile
```bash
# Using Expo Go for testing
npm run dev
# Scan QR with Expo Go app

# For distribution
# Create development build with `eas build`
# Or export signed APK/IPA
```

---

**Status**: Production Ready ✅
**Last Updated**: 2026-02-08
**Version**: 1.0.0
