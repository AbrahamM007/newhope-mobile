# Chat System Quick Reference

## 4 Chat Types at a Glance

| Type | Purpose | Participants | Icon | Example |
|------|---------|--------------|------|---------|
| **DM** | 1:1 messages | 2 people only | 👤 | Sarah ↔ You |
| **GROUP** | Ministry/Core teams | Group members | 👥 | Worship Team |
| **SMALL_GROUP** | Open community | Group members | 👥 | Young Adults |
| **SERVICE** | Service ops (⚡) | Assigned volunteers | 📅 | Sun 9AM Worship |

## UI Sections

```
INBOX
├─ Direct Messages
│  ├─ DM • Sarah
│  └─ DM • John
├─ Groups
│  ├─ GROUP • Worship Team
│  └─ SMALL_GROUP • Young Adults
└─ Upcoming Services
   └─ SERVICE • Sun 9AM (yellow badge)
```

## Files

| File | Purpose |
|------|---------|
| `app/messages.tsx` | Inbox (3 sections) |
| `app/chat/[id].tsx` | Chat view + service header |
| `components/ChatSettingsPanel.tsx` | Notification settings |
| `lib/chat-service.ts` | Chat logic |

## Key Methods

```typescript
// Load conversations by type
chatService.getDMConversations(userId)
chatService.getGroupConversations(userId)
chatService.getServiceConversations(userId)

// Send message
chatService.sendMessage(conversationId, senderId, content, mentions)

// Mute/unmute
chatService.muteConversation(conversationId, userId)
chatService.unmuteConversation(conversationId, userId)

// Settings
chatService.getChatSettings(userId)
chatService.updateChatSettings(userId, { notify_dms: false })

// Service chat
chatService.createServiceChat(serviceInstanceId, title)
chatService.addParticipantToConversation(conversationId, userId)
```

## Notifications

**DM** → Always notify (high priority)
**GROUP** → Normal, can mute
**SERVICE** → Always notify (time-sensitive)
**Quiet Hours** → 22:00 - 08:00 (customizable)
**Mute Options** → Individual chat, category, or all

## Database Tables

```
conversations          (type: DM|GROUP|SMALL_GROUP|SERVICE)
├─ conversation_participants (is_muted, unread_count)
├─ messages (content, mentions)
└─ message_reads (for DMs)
chat_settings          (per user)
```

## RLS Security

✅ Users only see their conversations
✅ DM access: 2 users only
✅ GROUP access: Members only
✅ SERVICE access: Assigned volunteers only
✅ Settings: Own settings only

## Quick Commands

### Create DM
```typescript
const id = await chatService.createDMConversation(user1, user2);
```

### Send with Mentions
```typescript
await chatService.sendMessage(convId, userId, 'Hey @team!', ['@team']);
```

### Auto-Service Chat (on service creation)
```typescript
const chat = await chatService.createServiceChat(serviceId, 'Sun 9AM');
```

### Add to Service Chat
```typescript
await chatService.addParticipantToConversation(serviceChatId, userId);
```

### Disable Notifications
```typescript
await chatService.updateChatSettings(userId, { mute_all_notifications: true });
```

## Badges on Each Chat

- **DM** - Blue badge (person)
- **GROUP** - Blue badge (group icon)
- **SMALL_GROUP** - Blue badge (group icon)
- **SERVICE** - Blue badge + calendar + date/time

## Service Chat Header Shows

- ⏰ Call Time: 8:30 AM
- 📍 Location: Main Stage
- 🎵 Setlist: [View]

## Mentions Support

- `@name` → Mention specific person
- `@worshipteam` → Mention group
- `@all` → Everyone (leaders only)

## Settings

✅ Notify DMs
✅ Notify Groups
✅ Notify Services
✅ Notify Announcements
✅ Notify Prayer
✅ Notify Events
🔇 Mute All
⏰ Quiet Hours

## Integration Points

**Worship Team**
- Service created → Auto-create SERVICE chat
- Volunteer assigned → Auto-add to chat
- Volunteer declines → Auto-remove from chat

**Groups**
- User joins → Add to conversation_participants
- User leaves → Remove from conversation_participants

**Notifications**
- Message sent → Check settings → Send notification
- Mention → Override all mutes

## Common Workflows

### Start Conversation with Director
```typescript
const dmId = await chatService.createDMConversation(myId, directorId);
// → Opens in DM section
```

### Send Service Assignment Chat
```typescript
await chatService.addParticipantToConversation(serviceChatId, volunteerId);
// → They see in Upcoming Services section
// → High-priority notification sent
```

### Mute Group Without Leaving
```typescript
await chatService.muteConversation(groupChatId, userId);
// → Conversation stays visible but muted
// → No notifications unless mentioned
```

## Type Safety

✅ All new code is 100% TypeScript
✅ Zero `any` types
✅ Full type interfaces
✅ Passes typecheck

---

**Status**: Production Ready ✅
**Type Safe**: Yes ✅
**Secure**: Yes (RLS) ✅
**Tested**: Yes ✅
