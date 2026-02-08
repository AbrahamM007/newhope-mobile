# Church App - Supabase Integration & Deployment Guide

## Overview

This comprehensive church management app is fully integrated with Supabase for authentication, real-time data sync, and secure access control. The app is production-ready and follows industry best practices for mobile app development.

## Architecture

### Technology Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Authentication**: Supabase Auth (email/password)
- **Database**: Supabase PostgreSQL
- **Real-time**: Supabase Realtime (WebSockets)
- **API**: Direct Supabase queries with RLS

### Project Structure

```
app/
├── (auth)/                 # Authentication screens (login, signup)
├── (tabs)/                 # Main app tabs
│   ├── index.tsx          # Home/Dashboard
│   ├── social.tsx         # Social feed
│   ├── groups.tsx         # Groups & communities
│   ├── serve.tsx          # Volunteer serving schedule
│   └── media.tsx          # Sermons & media
├── announcements.tsx       # Announcements
├── events.tsx             # Events calendar
├── prayer.tsx             # Prayer requests
├── give.tsx               # Giving/donations
├── profile.tsx            # User profile
├── messages.tsx           # Messaging
└── directory.tsx          # Member directory

context/
├── AuthContext.tsx        # Supabase auth management

lib/
├── supabase.ts           # Supabase client initialization
├── supabase-service.ts   # Centralized query service
├── api.ts                # Legacy (deprecated)
└── theme.ts              # Design system

supabase/migrations/
├── 01_core_tables.sql        # Users, campuses, roles
├── 02_social_and_groups.sql  # Posts, comments, groups
├── 03_messaging_events_services.sql
└── 04_prayer_giving_media_announcements.sql
```

## Core Features Implemented

### 1. Authentication System
- Email/password signup and login via Supabase Auth
- Automatic session management
- Profile linking to auth users
- Secure token handling

### 2. Social Features
- Post creation and sharing
- Like/reaction system
- Comments with threading
- Story posting (24-hour expiration)
- Topic-based feeds

### 3. Groups & Communities
- Group discovery
- Join/leave groups
- Group messaging
- Member management

### 4. Messaging
- Direct messaging (DMs)
- Group conversations
- Team channels
- Message history

### 5. Events
- Event creation and discovery
- RSVP management
- Event calendar
- Attendance tracking

### 6. Volunteer Services
- Serving schedule
- Role assignments
- Confirmation workflow
- Team coordination

### 7. Prayer & Care
- Prayer request submission
- Prayer circle coordination
- Update tracking
- Privacy-aware sharing

### 8. Content & Media
- Sermon library
- Video streaming
- Downloadable content
- Bookmarks and notes

### 9. Administration
- Role-based access control
- User management
- Announcement distribution
- Analytics dashboard

## Supabase Configuration

### Environment Variables

Create a `.env` file with:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Database Schema

The app uses the following tables (all with RLS enabled):

#### Core Tables
- `campuses` - Church locations
- `profiles` - User profiles linked to auth
- `roles` - Role definitions (member, volunteer, leader, pastor, admin)
- `user_roles` - User-role assignments
- `ministries` - Ministry departments
- `ministry_members` - Ministry membership
- `households` - Family groupings
- `user_blocks` - User blocking for safety

#### Social Tables
- `groups` - Small groups and communities
- `group_members` - Group membership
- `posts` - Social feed posts
- `comments` - Post comments
- `post_reactions` - Emoji reactions
- `post_saves` - Bookmarked posts
- `stories` - 24-hour stories
- `story_views` - Story view tracking

#### Messaging Tables
- `conversations` - Message threads
- `messages` - Individual messages
- `message_reactions` - Message reactions

#### Event & Service Tables
- `events` - Church events
- `event_rsvps` - Event attendance
- `services` - Sunday services
- `service_assignments` - Volunteer assignments
- `service_roles` - Role definitions for services

#### Care & Prayer Tables
- `prayer_requests` - Prayer requests
- `prayer_circles` - Prayer groups
- `prayer_updates` - Prayer status updates
- `care_workflows` - Care coordination

#### Other Tables
- `announcements` - Official communications
- `giving_transactions` - Donation records
- `giving_campaigns` - Fundraising campaigns
- `media` - Sermon/video library
- `media_notes` - User notes on media
- `media_bookmarks` - Saved media positions

## Security & Row Level Security (RLS)

### Core Principles

1. **Authenticated Access**: Most tables require authentication
2. **Ownership Checks**: Users can only modify their own data
3. **Role-Based Access**: Permissions tied to user roles
4. **Scope-Based Visibility**: Content visible based on scope (PUBLIC_CHURCH, MINISTRY, GROUP, HOUSEHOLD, LEADERS_ONLY)

### Key RLS Policies

#### Profiles
- Users can view non-private profiles
- Users can only update their own profile
- Admin can manage all profiles

#### Posts
- Users see only approved posts
- Scope-based visibility (PUBLIC_CHURCH, MINISTRY, GROUP)
- Authors can modify their own posts

#### Groups
- Public groups visible to all
- Private groups only for members
- Leaders can modify group settings

#### Messages
- Users only see their own messages
- Group messages visible to group members
- Leaders can moderate

#### Events
- Public events visible to all
- RSVP status only for attendees
- Leaders can modify event details

## API Service Layer

### Usage Examples

```typescript
import { supabaseService } from '@/lib/supabase-service';

// Get feed posts
const posts = await supabaseService.posts.getFeed(10, 0);

// Create a post
await supabaseService.posts.create('Hello church!', 'text', 'PUBLIC_CHURCH');

// React to a post
await supabaseService.posts.react(postId, 'heart');

// Get my groups
const myGroups = await supabaseService.groups.getMyGroups();

// Join a group
await supabaseService.groups.join(groupId);

// Get announcements
const announcements = await supabaseService.announcements.getAll(10);

// Search profiles
const results = await supabaseService.profiles.search('John');
```

## Real-Time Features

The app supports real-time updates via Supabase subscriptions:

```typescript
// Subscribe to new posts
supabase
  .channel('posts')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'posts' },
    payload => {
      // Handle new post
    }
  )
  .subscribe();
```

## Deployment Checklist

### Pre-Deployment

- [ ] Environment variables configured in `.env`
- [ ] Supabase project created and configured
- [ ] All migrations applied to database
- [ ] RLS policies verified
- [ ] Auth settings configured (email confirmation, etc.)
- [ ] Storage buckets created (if using file uploads)
- [ ] Email templates configured

### Build & Testing

- [ ] Run `npm install` to install dependencies
- [ ] Run `npm run build:web` to test build
- [ ] Test auth flow (signup, login, logout)
- [ ] Test core features (posts, groups, messages)
- [ ] Test with different user roles
- [ ] Verify error handling and loading states

### Production Deployment

1. **Supabase Configuration**
   ```bash
   # Set up production Supabase project
   # Configure domain restrictions if needed
   # Set up backups and monitoring
   ```

2. **Environment Setup**
   ```bash
   # Create .env.production with production URLs
   EXPO_PUBLIC_SUPABASE_URL=production_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=production_key
   ```

3. **Deploy to Production**
   ```bash
   # Build for production
   npm run build:web

   # Deploy to hosting (Vercel, Netlify, etc.)
   ```

4. **Post-Deployment**
   - [ ] Verify all features working
   - [ ] Monitor error logs
   - [ ] Check database performance
   - [ ] Verify authentication flow
   - [ ] Test real-time updates

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Authentication**
   - Signup success rate
   - Login failures
   - Session timeouts

2. **Database**
   - Query performance
   - Storage usage
   - RLS policy violations

3. **Real-time**
   - Connection stability
   - Message latency
   - Update frequency

4. **Application**
   - Error rates
   - Feature usage
   - User engagement

### Regular Maintenance Tasks

1. **Weekly**
   - Check error logs
   - Verify backups
   - Monitor performance

2. **Monthly**
   - Review security logs
   - Update dependencies
   - Analyze usage metrics

3. **Quarterly**
   - Full security audit
   - Performance optimization
   - Database cleanup

## Troubleshooting

### Authentication Issues

**Problem**: Users can't log in
**Solution**:
- Verify Supabase auth is enabled
- Check environment variables
- Verify email is confirmed (if required)
- Check user auth records in Supabase dashboard

### Database Connection Issues

**Problem**: Queries fail intermittently
**Solution**:
- Check internet connectivity
- Verify Supabase project is active
- Check RLS policies for permission errors
- Monitor database performance

### Real-time Updates Not Working

**Problem**: Changes aren't reflected immediately
**Solution**:
- Verify WebSocket connection
- Check Supabase realtime is enabled
- Verify subscription filters
- Check network latency

## API Reference

### Authentication Context

```typescript
const { user, loading, isAuthenticated, signUp, signIn, signOut } = useAuth();

// User object structure
{
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  profile?: UserProfile;
}
```

### Service Methods

See `lib/supabase-service.ts` for full API documentation.

## Performance Optimization

### Implemented Optimizations

1. **Query Optimization**
   - Selective field selection (`.select('field1,field2')`)
   - Pagination with `.range()`
   - Proper indexes on frequently queried fields

2. **Caching**
   - Local state caching
   - Memoization of expensive computations

3. **Real-time Efficiency**
   - Selective subscriptions
   - Efficient payload sizes

4. **UI Optimization**
   - Lazy loading of lists
   - Skeleton loading states
   - Optimistic updates

## Security Best Practices

1. **Never Store Secrets in Client Code**
   - Use environment variables
   - Store only public keys

2. **Validate on Server**
   - RLS policies enforce server-side validation
   - Client-side validation for UX only

3. **Use HTTPS**
   - All Supabase connections use HTTPS
   - Verify SSL certificates

4. **Rate Limiting**
   - Implement rate limiting in API layer
   - Monitor for abuse patterns

5. **Data Privacy**
   - Respect privacy settings
   - Implement proper blocking/reporting
   - Handle sensitive data carefully

## Support & Resources

- Supabase Docs: https://supabase.com/docs
- Expo Docs: https://docs.expo.dev
- React Native Docs: https://reactnative.dev

## Changelog

### v1.0.0 - Initial Release
- Full Supabase integration
- Authentication system
- Social features
- Messaging
- Events & RSVP
- Prayer & Care
- Volunteer services
- Admin dashboard

## License

[Your License Here]

## Support

For issues or questions, contact: support@yourchurch.com
