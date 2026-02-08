# Worship Team Scheduling System - Complete Implementation Guide

## Overview

Your worship team now has a **complete, Planning Center-style scheduling system** with:

✅ **Volunteer Management** - Qualifications, experience levels, availability
✅ **Smart Scheduling** - Auto-suggest algorithm matches volunteers to positions
✅ **Request/Accept/Decline Workflow** - Planning Center's core functionality
✅ **Availability Tracking** - Weekly availability + blockout dates
✅ **Position Management** - Define worship roles and qualifications
✅ **Setlist Management** - Songs per service with keys and arrangements
✅ **Rehearsal Scheduling** - Team rehearsals with attendance tracking
✅ **Full Database Integration** - Supabase backend with RLS

---

## System Architecture

### A) The Worship Team as a Core Group

The Worship Team is a **CORE GROUP** in your groups system:
- `group_type_category = 'CORE'`
- `join_policy = 'INVITE_ONLY'`
- `is_core_group = true`

This means:
- Users cannot self-join
- Only leaders can add members
- Members request to serve (approval workflow)

**Benefits:**
- Controls who has access to worship scheduling
- Manages team communications
- Tracks training and resources
- Maintains team roster

### B) Core Worship System Objects

```
Worship Team (CORE Group)
    ├── Position Definitions
    │   ├── Worship Leader
    │   ├── Keys
    │   ├── Drums
    │   ├── Bass
    │   └── etc.
    │
    ├── Volunteer Profiles
    │   ├── Qualifications
    │   ├── Experience Level
    │   ├── Availability
    │   └── Rotation Weight
    │
    ├── Service Instances (Sunday 9AM, etc.)
    │   ├── Setlist
    │   ├── Position Slots
    │   └── Serving Requests
    │
    ├── Rehearsals
    │   └── Attendance Tracking
    │
    └── Serving Requests
        ├── Request → Pending
        ├── Accept → Confirmed
        └── Decline → Open Again
```

---

## User Roles & Permissions

### Super Admin
- Creates position definitions
- Assigns worship leaders to core group
- Can manually schedule anyone
- Approves volunteer applications
- Views all analytics

### Worship Director (Group Leader)
- Manages worship team roster
- Creates/edits schedules
- Assigns volunteers to positions
- Reviews volunteer requests
- Uploads setlists
- Sends team announcements

### Worship Leader (Service Leader)
- Manages specific Sunday service
- Can edit setlist for that service
- Add notes for team
- Message volunteers
- Request volunteers for last-minute needs

### Worship Volunteer (Member)
- View schedules
- Accept/decline requests
- Set availability
- Add blockout dates (vacation)
- View setlists and practice materials
- Participate in team chat

### Normal Member
- Cannot access scheduling
- Can request to serve (request-to-join workflow)

---

## Data Model

### Position Definitions
```typescript
{
  id: UUID
  ministry_id: UUID (Worship Team group)
  name: "Keys" | "Drums" | "Bass" | etc.
  description: "Keyboard player"
  required_qualifications: ["music_theory", "keyboard_skills"]
  is_critical: true  // Cannot have empty slot
  display_order: 1
  is_active: true
}
```

### Volunteer Serving Profile
```typescript
{
  id: UUID
  user_id: UUID (volunteer)
  ministry_id: UUID (Worship Team)
  positions_qualified: ["keys", "bass"]
  preferred_positions: ["keys"]
  experience_level: "intermediate"
  can_attend_rehearsal: true
  max_services_per_month: 4
  avoid_back_to_back: true
  status: "active" | "inactive" | "on_break"
  last_served_at: Date
  rotation_weight: 100  // Fairness algorithm
}
```

### Volunteer Availability
```typescript
{
  id: UUID
  volunteer_profile_id: UUID
  sunday_morning: true
  sunday_evening: false
  wednesday_evening: true
  other_days: { "friday_night": true }
  updated_at: Date
}
```

### Blockout Dates
```typescript
{
  id: UUID
  volunteer_profile_id: UUID
  start_date: "2026-06-01"
  end_date: "2026-06-15"
  reason: "Vacation"
}
```

### Serving Request (Request/Accept/Decline)
```typescript
{
  id: UUID
  service_instance_id: UUID
  position_name: "Keys"
  user_id: UUID (volunteer)
  status: "pending" | "accepted" | "declined" | "withdrawn" | "completed"
  requested_by: UUID (leader)
  requested_at: Date
  expires_at: Date (optional)
  responded_at: Date
  response_notes: "Can't make it this week"
}
```

---

## How It Works - Step by Step

### Step 1: Setup Position Definitions

**Admin Action:**
```typescript
await worshipService.positions.create(
  ministryId,
  "Keys",
  "Keyboard player",
  ["music_theory", "keyboard_skills"]
)
```

**Result:** Position is now available for scheduling

### Step 2: Volunteer Joins Team

**User Journey:**
1. Opens Groups tab → Ministry Teams
2. Finds "Worship Team"
3. Taps "Request" button
4. Fills out volunteer form:
   - Interested positions (multi-select)
   - Experience level
   - Weekly availability
   - Can attend rehearsal?
   - Notes/demo upload

**Leader Action:**
1. Reviews request
2. Approves or rejects
3. If approved:
   - User added to Worship Team group
   - Volunteer profile created automatically
   - Access to scheduling features enabled

### Step 3: Volunteer Sets Availability

**Volunteer Journey:**
1. Opens Worship tab (in their groups)
2. Taps "My Schedule"
3. Sees "Availability Settings"
4. Toggles:
   - Sunday Morning ✓
   - Sunday Evening ✗
   - Wednesday ✓
5. Saves

**Additionally:**
1. Can add blockout dates ("Vacation June 1-15")
2. Can update max services per month ("No more than 3")
3. Can specify rotation preferences

### Step 4: Leader Schedules

**Director Journal:**
1. Opens "Schedule Builder"
2. Selects date range (Sunday Sept 1-30)
3. Sees grid of services
4. For each position slot:
   - Clicks "Assign"
   - Or clicks "Auto-Suggest" (WOW!)
   - System suggests top 5 qualified volunteers
   - Selects one
   - Creates serving request

### Step 5: Auto-Suggest (The WOW Feature)

**Algorithm:**
```
For each position/service:
1. Get all volunteers qualified for position
2. Filter out:
   - Blocked out on that date
   - Exceeded monthly max
   - Back-to-back constraints
3. Sort by:
   - Least recently served (fairness)
   - Rotation weight (preferences)
   - Preferred position match
4. Return top 5 suggestions
```

**Result:**
- Volunteers get fair rotation
- Best matches recommended
- Respects all constraints
- Leaders see options instantly

### Step 6: Request/Accept/Decline

**Leader sends request:**
```typescript
await worshipService.requests.create(
  serviceInstanceId,
  "Keys",
  volunteerId,
  leaderId,
  expiresAt: "2 days from now"
)
```

**Volunteer receives notification:**
"You've been requested for Keys on Sunday 9AM. Accept?"

**Volunteer responds:**
- ✅ Accept → Confirmed, shows on schedule
- ✗ Decline → Slot opens, can request someone else
- 📝 Message → Add optional note

**Result:**
- Transparent workflow
- Volunteers in control
- Leaders can fill slots quickly

---

## User Experience Flows

### For a Volunteer

**My Schedule View:**
```
Upcoming Services
┌────────────────────────────────┐
│ Sunday 9AM - Sept 5            │
│ Keys (Accepted)                │
│ ✓ Confirmed by Sarah           │
└────────────────────────────────┘
  [View Setlist] [Message Team]
  [Practice Mode] [I'm Here]

Pending Requests
┌────────────────────────────────┐
│ Wednesday 7PM - Sept 9         │
│ Background Vocals (Pending)    │
│ Expires in 2 days              │
└────────────────────────────────┘
  [Accept] [Decline with note]

Availability Settings
┌────────────────────────────────┐
│ ✓ Sunday Morning               │
│ ✗ Sunday Evening               │
│ ✓ Wednesday Evening            │
│                                │
│ Max Services/Month: 4          │
│ Avoid Back-to-Back: ON         │
│                                │
│ Blockout Dates:                │
│ June 1-15: Vacation            │
│ [Add Blockout]                 │
└────────────────────────────────┘
```

### For a Director

**Schedule Grid:**
```
         Sunday 9AM    Sunday 11AM   Wednesday
Sept 5   [SCHEDULED]   [ASSIGNED]    [OPEN]
         Worship L:    Keys:         Bass:
         John          Sarah ✓       NEEDS
         Drums:        Drums:        ASSIGNMENT
         Mike ✓        [AUTO-SUG]

Sept 12  [REQUEST]     [OPEN]        [OPEN]
         Vocals:       All slots
         Jennifer      available
         (Pending)
```

**Adding a Volunteer:**
```
1. Click "Assign" on Keys slot
2. Three options:
   a) Search volunteers
   b) Auto-suggest (recommended)
   c) Request swap with existing
3. Select volunteer
4. Request sent automatically
5. Pending → Accepted/Declined
6. View updates in grid
```

### For a Worship Leader

**Service Day Dashboard:**
```
Sunday 9AM Service

Call Time: 8:30 AM
Location: Main Campus Sanctuary

Setlist (5 songs)
1. "Goodness of God" (D)
   [View Chart] [Arrangement Notes]
2. "Living Hope" (A)
3. "What A Beautiful Name"
4. "Jesus I Come"
5. "Goodness Follows"

Team Roster
✓ John Smith (Worship Leader)
✓ Sarah Johnson (Keys)
✓ Mike Davis (Drums)
✗ Jennifer (Vocals) - Declined
⏳ Alex (Bass) - Pending

Actions:
[Message Team] [Find Replacement] [Service Chat]
```

---

## API Methods

### Positioning

```typescript
worshipService.positions.getAll(ministryId)
worshipService.positions.create(ministryId, name, description, qualifications)
```

### Volunteer Profiles

```typescript
worshipService.volunteers.getProfile(userId, ministryId)
worshipService.volunteers.createProfile(userId, ministryId)
worshipService.volunteers.updateProfile(profileId, updates)
worshipService.volunteers.getAvailable(ministryId, serviceDate, position?)
```

### Availability

```typescript
worshipService.availability.getOrCreate(profileId)
worshipService.availability.update(profileId, { sunday_morning: true, ... })
```

### Blockout Dates

```typescript
worshipService.blockout.add(profileId, startDate, endDate, reason)
worshipService.blockout.getAll(profileId)
worshipService.blockout.delete(blockoutId)
```

### Serving Requests

```typescript
worshipService.requests.create(serviceId, position, userId, requestedBy, expiresAt)
worshipService.requests.getForService(serviceId)
worshipService.requests.getForUser(userId)
worshipService.requests.getPending(userId)
worshipService.requests.respond(requestId, 'accepted'|'declined', notes)
worshipService.requests.getStats(userId, ministryId, startDate, endDate)
```

### Services

```typescript
worshipService.services.getUpcoming(ministryId, limit)
worshipService.services.getById(serviceId)
worshipService.services.getScheduleGrid(ministryId, startDate, endDate)
```

### Auto-Suggest

```typescript
worshipService.autoSuggest.getFor(serviceId, positionName)
// Returns: Top 5 recommended volunteers sorted by fairness
```

### Rehearsals

```typescript
worshipService.rehearsals.getFor(ministryId)
worshipService.rehearsals.create(ministryId, title, dateTime, location, notes)
worshipService.rehearsals.addAttendee(rehearsalId, userId)
worshipService.rehearsals.respondToReheasal(rehearsalId, userId, 'confirmed'|'declined')
```

### Songs & Setlists

```typescript
worshipService.songs.getAll(ministryId)
worshipService.songs.create(ministryId, title, artist, key, bpm)
worshipService.songs.getSetlist(serviceId)
worshipService.songs.addToSetlist(serviceId, songId, order, keyOverride, bpmOverride)
```

---

## Database Tables

```sql
-- Core Tables
position_definitions      -- Worship roles
volunteer_serving_profiles -- Volunteer qualifications
volunteer_availability    -- Weekly schedule availability
volunteer_blockout_dates  -- Vacation/blackout periods
serving_requests          -- Request/accept/decline workflow

-- Enhanced Service Instances
service_instances         -- Already exists (Sunday 9AM, etc.)

-- Song Management
songs                     -- Song library
setlist_songs             -- Songs per service

-- Rehearsals
rehearsals                -- Rehearsal scheduling
rehearsal_attendance      -- Who's attending rehearsal
```

---

## Scheduling Constraints (Rules Engine)

### Hard Constraints (Cannot Break)
✓ Volunteer must be in Worship Team group
✓ Volunteer must be qualified for position
✓ Volunteer must not be blocked out
✓ Position assignment must be unique per service

### Soft Constraints (Auto-Suggest Respects)
~ Avoid back-to-back weeks for same volunteer
~ Balance load across available volunteers
~ Respect max services per month
~ Honor preferred positions
~ Rotate fairly (least recently served)

---

## Workflow Diagrams

### Volunteer Journey

```
1. Normal User
       ↓
   [Groups Tab] → Sees Worship Team
       ↓
   [Request to Serve] → Fills form
       ↓
   REQUEST CREATED (pending)
       ↓
   [Leader Reviews]
       ├─→ APPROVED
       │      ↓
       │  Added to Group
       │  Profile Created
       │  Gains Access
       │
       └─→ REJECTED
              ↓
          Notified with reason
          Can request again later

2. Approved Volunteer
       ↓
   [Opens Worship] → My Schedule
       ↓
   [Set Availability]
   [Add Blockouts]
   [View Requests]
       ↓
   [Receives Request] → "Keys - Sept 5"
       ├─→ Accept → Confirmed
       └─→ Decline → Slot opens
```

### Leader Workflow

```
1. View Schedule
   [Date Range] → Grid View
       ↓
   See all services & slots
   See filled/open positions
       ↓

2. Fill a Slot
   [Click Position]
       ├─→ Manual Search
       │      ↓
       │   Search volunteers
       │   Select one
       │
       └─→ Auto-Suggest (WOW!)
              ↓
          System suggests top 5
          Select one
              ↓
   REQUEST CREATED → Sent to volunteer
       ↓
   Volunteer receives notification
       ├─→ Accepts → Scheduled
       └─→ Declines → Try next suggestion
```

---

## Best Practices

### For Directors
1. **Create clear positions** - Set qualifications upfront
2. **Use auto-suggest** - It's smart and fair
3. **Communicate early** - Send requests 2-3 weeks ahead
4. **Set realistic maxes** - Max services/month should be achievable
5. **Approve volunteers quickly** - Don't delay applications

### For Volunteers
1. **Set availability early** - Plan ahead
2. **Add blockouts** - Vacation/blackouts respected
3. **Respond promptly** - Accept/decline quickly
4. **Communicate** - Add notes if declining
5. **Build your schedule** - Get on rotation regularly

### For Your Team
1. **Regular rehearsals** - Keep team sharp
2. **Shared resources** - Song charts, arrangements, audio
3. **Clear communication** - Team chat per service
4. **Celebrate wins** - Acknowledge good performances
5. **Onboard new volunteers** - Good first experience

---

## Troubleshooting

### "I don't see any volunteers to schedule"
- Check if volunteers have accepted serving requests
- Check availability settings
- Check blockout dates
- Verify volunteer is in Worship Team group

### "Auto-suggest showing wrong people"
- Confirm volunteer qualifications are set
- Check blockout dates
- Verify rotation weight settings
- Look at last_served_at date

### "Volunteer didn't see their request"
- Check notification settings
- Ensure they're in the Worship Team group
- Verify request hasn't expired
- Check their device notification permissions

### "Can't add someone to the team"
- They must request to serve first
- Leader must approve their request
- Then they appear in available volunteers

---

## Integration with Worship Team Features

This system integrates seamlessly with:

✅ **Worship Team Group Chat** - Announcements and messages
✅ **Setlists** - Songs for each service
✅ **Rehearsals** - Practice sessions with attendance
✅ **Team Resources** - Charts, audio, training
✅ **Service Days** - Full team dashboard

---

## Performance & Fairness

### Auto-Suggest Algorithm

1. **Fairness First** - Tracks who served recently
2. **Rotation Weight** - Preferences weighted fairly
3. **Skill Match** - Preferred positions prioritized
4. **Constraint Respect** - All rules honored
5. **Transparent** - Shows why person suggested

### Load Balancing

- Prevents over-scheduling
- Respects monthly limits
- Allows time off
- Promotes team health

---

## Next Steps

### Ready Now
✅ Volunteer profiles and availability
✅ Position definitions and qualifications
✅ Request/accept/decline workflow
✅ Auto-suggest scheduling
✅ Setlist and song management
✅ Rehearsal scheduling

### Recommended Soon
- Team communication channels
- Shared resource library
- Practice audio/video
- Service day checklist
- Analytics and reporting

---

## Support

For questions or issues:
1. Check this guide first
2. Review your volunteer's profile settings
3. Verify service instance and positioning setup
4. Contact your worship director

---

**Status**: ✅ PRODUCTION READY
**Build**: ✅ SUCCESSFUL
**Database**: ✅ MIGRATIONS APPLIED
**Security**: ✅ RLS ENABLED

Your worship team scheduling system is complete and ready to use!
