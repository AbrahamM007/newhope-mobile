# Chat System Implementation Guide

## Overview

A comprehensive 4-type chat system designed for the church app with clear visual separation, robust security, and smart notification management.

## Chat Types

### 1. Direct Messages (DM)
- **1:1 conversations only**
- Private between two users
- Not tied to any group
- Example: Member talking to Worship Director

**Database:**
- Type: `DM`
- linked_group_id: null
- linked_service_id: null

### 2. Group Chat (Core Group / Ministry Chat)
- Tied to a core/ministry group
- Examples: Worship Team, Elders, Ushers, Women's Ministry
- Only group members can access
- Read by all invited members

**Database:**
- Type: `GROUP`
- linked_group_id: [group_id]

### 3. Small Group Chat (Open Group Chat)
- Tied to a community/open group
- Examples: Tuesday Bible Study, Young Adults Group, Marriage Group
- Open membership groups
- Anyone in the group can chat

**Database:**
- Type: `SMALL_GROUP`
- linked_group_id: [group_id]

### 4. Service Chat (CRITICAL)
- Time-sensitive operational chat
- Tied to specific service instance (e.g., Sunday 9AM Worship)
- Only includes people assigned to serve on that service
- Example participants: Worship Leader, Keys, Vocals, FOH, Slides, Camera, etc.
- **Auto-created** when service instance is created
- Users auto-added when assigned to service
- Users removed if they decline or are replaced

**Database:**
- Type: `SERVICE`
- linked_service_id: [service_instance_id]

## UI Layout

### Inbox Screen (`/app/messages.tsx`)

Displays conversations in **3 clear sections**:

```
┌─────────────────────────────────────┐
│  DIRECT MESSAGES                    │
├─────────────────────────────────────┤
│  • DM • Sarah (Worship Director)    │
│  • DM • John (Pastor)               │
│                                     │
├─────────────────────────────────────┤
│  GROUPS                             │
├─────────────────────────────────────┤
│  • GROUP • Worship Team             │
│  • SMALL_GROUP • Young Adults       │
│                                     │
├─────────────────────────────────────┤
│  UPCOMING SERVICES                  │
├─────────────────────────────────────┤
│  • SERVICE • Sun 9AM Worship        │
│  • SERVICE • Wed 7PM Prayer Meeting │
└─────────────────────────────────────┘
```

### Chat List Badges (Mandatory)

Every conversation row displays a badge identifying type:

- **DM** - Blue badge, person icon
- **GROUP** - Blue badge, group icon
- **SMALL_GROUP** - Blue badge (shown as "SMALL_GROUP")
- **SERVICE** - Blue badge with calendar icon + date/time tag

### Chat Detail Screen (`/app/chat/[id].tsx`)

#### Regular Chat Header
```
← Conversation Title
```

#### Service Chat Header (WITH INFO PANEL)
```
← Sun 9AM Worship Team
├─ Call Time: 8:30 AM
├─ Location: Main Stage
└─ Setlist: [View]
```

The service info header acts as a **command center** for the service, showing:
- Service date/time
- Call time (when to arrive)
- Rehearsal time
- Setlist shortcut
- Run-of-show shortcut

## Database Schema

### conversations
```sql
id              uuid
type            text (DM | GROUP | SMALL_GROUP | SERVICE)
title           text
description     text
icon_type       text (user | group | calendar)
linked_group_id uuid (nullable)
linked_service_id uuid (nullable)
created_by      uuid
last_message_at timestamptz
is_archived     boolean
created_at      timestamptz
updated_at      timestamptz
```

### conversation_participants
```sql
id              uuid
conversation_id uuid
user_id         uuid
last_read_at    timestamptz (nullable)
unread_count    integer
is_muted        boolean
joined_at       timestamptz
```

### messages
```sql
id              uuid
conversation_id uuid
sender_id       uuid
content         text
mentions        text[] (@name, @team, @all)
reply_to_id     uuid (nullable)
created_at      timestamptz
edited_at       timestamptz (nullable)
```

### message_reads
```sql
id              uuid
message_id      uuid
reader_id       uuid
read_at         timestamptz
```

### chat_settings (Per User)
```sql
user_id                      uuid
notify_dms                   boolean (default: true)
notify_groups                boolean (default: true)
notify_services              boolean (default: true)
notify_announcements         boolean (default: true)
notify_prayer                boolean (default: true)
notify_events                boolean (default: true)
dm_read_receipts             boolean (default: false)
mute_all_notifications       boolean (default: false)
quiet_hours_enabled          boolean (default: false)
quiet_hours_start            text (default: 22:00)
quiet_hours_end              text (default: 08:00)
```

## Notification Logic

### DM Notifications
- **Default**: Always notify (high priority)
- **Can be muted**: Individual chat or all DMs
- **Read receipts**: Optional per settings

### Group Chat Notifications
- **Default**: Normal priority
- **Muting options**:
  - Mute individual chat
  - Mute entire GROUP category
  - Mute entire SMALL_GROUP category
  - Quiet hours (time-based)
- **Mentions**: Can still notify if muted (user setting)

### Service Chat Notifications
- **Default**: High priority (time-sensitive)
- **Cannot be fully muted** when scheduled
- **Always notify** for critical operations
- **Can use quiet hours** if needed
- **Mention notifications**: Override all mutes

### Other Notifications
- **Announcements**: Toggle in settings
- **Prayer Requests**: Toggle in settings
- **Events**: Toggle in settings

## Access Control (RLS)

### DM Conversations
- Only the 2 participants can see/access
- Automatically created when users start DM
- Policy checks: User must be in conversation_participants

### Group Conversations
- Only group members can see
- Determined by group membership
- Policy checks: User must be in group AND conversation_participants

### Service Conversations
- Only assigned volunteers can see
- Determined by service_assignments table
- Policy checks: User must be assigned to service instance

## Muting & Priority

### Muting Options
1. **Individual Chat Mute** - Mute specific conversation
2. **Category Mute** - Mute all GROUP chats or all SMALL_GROUP chats
3. **Global Mute** - Disable all notifications
4. **Quiet Hours** - Time-based suppression (22:00 - 08:00 default)

### Priority Defaults
- **Service Chats**: High (always critical)
- **DMs**: High (personal)
- **Group Chats**: Normal
- **Announcements**: Normal

### Mention Overrides
- Mentions in groups: Can still notify even if muted
- Mentions in service chats: Override all mutes
- Configurable per user

## API Usage

### Creating Conversations

**DM Conversation:**
```typescript
const dmId = await chatService.createDMConversation(userId1, userId2);
```

**Service Chat (Auto-created):**
```typescript
const serviceChat = await chatService.createServiceChat(serviceInstanceId, 'Sun 9AM Worship');
```

### Sending Messages

```typescript
await chatService.sendMessage(
  conversationId,
  senderId,
  'Message content',
  ['@worshipteam', '@mentions'] // Optional mentions
);
```

### Managing Participants

```typescript
// Add to service chat when assigned
await chatService.addParticipantToConversation(conversationId, userId);

// Remove if declined or replaced
await chatService.removeParticipantFromConversation(conversationId, userId);
```

### Muting/Unmuting

```typescript
// Mute a conversation
await chatService.muteConversation(conversationId, userId);

// Unmute
await chatService.unmuteConversation(conversationId, userId);
```

### Settings Management

```typescript
// Get user settings
const settings = await chatService.getChatSettings(userId);

// Update settings
await chatService.updateChatSettings(userId, {
  notify_dms: false,
  quiet_hours_enabled: true,
});
```

## File Structure

```
/app
  /messages.tsx          ← Inbox with 3 sections
  /chat
    /[id].tsx            ← Chat detail + service info header
/components
  /ChatSettingsPanel.tsx ← Notification & muting settings
/lib
  /chat-service.ts       ← All chat operations
/supabase/migrations
  /enhance_chat_system.sql ← Schema
```

## Key Implementation Notes

1. **Service chats auto-create** when a service instance is created in worship team system
2. **Service chats auto-populate** when volunteers are assigned and accept
3. **Service chats remove users** when they decline or are replaced
4. **Mentions use `@`** - supported: `@name`, `@team`, `@all` (leaders only)
5. **Read receipts DM-only** for privacy in group chats
6. **Quiet hours don't affect** service chats or mentions
7. **Unread count** automatically maintained per conversation_participant
8. **Last message timestamp** updated on every message
9. **Muting stored** in conversation_participants table (is_muted flag)
10. **All chat access** controlled by RLS policies - no access outside policy rules

## Integration Points

### When to Auto-Create Service Chats
- Worship team creates service instance
- System auto-creates conversation type=SERVICE
- Links to that service_instance_id

### When to Add/Remove from Service Chat
- **Add**: When volunteer accepts assignment
- **Remove**: When volunteer declines or is replaced
- **Updates**: Real-time through service assignment flow

### Notification Triggers
- Message sent → Check conversation type → Check user settings → Send notification
- Mention detected → Override all mutes (with option to disable)
- Service scheduled → High priority if user assigned

## Future Enhancements

- Message reactions (emoji)
- Typing indicators
- Voice messages
- Video chat integration
- Message search
- Conversation threading/topics
- Bot announcements
- Message scheduling
- Bulk messaging to groups
