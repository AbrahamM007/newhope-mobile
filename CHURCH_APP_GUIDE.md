# NewHope.life Mobile App - Complete Implementation

## Overview
The NewHope.life mobile app is a comprehensive church community platform built with React Native and Expo. It serves as the primary daily touchpoint between members and the church, featuring a private social network, discipleship tools, volunteer coordination, and more.

## Architecture

### Technology Stack
- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Email/Password Auth
- **Navigation**: Expo Router with tab-based layout
- **State Management**: React Context API
- **Icons**: Lucide React Native

### Database Schema
The application uses a comprehensive Supabase schema with:
- **Authentication**: `profiles`, `user_roles`, `households`
- **Social**: `posts`, `comments`, `post_likes`, `post_saves`
- **Community**: `groups`, `group_members`, `ministries`
- **Messaging**: `messages`, `message_threads`, `thread_members`, `thread_messages`
- **Events**: `events`, `event_rsvps`
- **Serving**: `serving_roles`, `serving_commitments`
- **Spiritual**: `prayer_requests`, `prayer_responses`
- **Giving**: `giving_records`
- **Media**: `media` (sermons, devotionals)

All tables have Row-Level Security (RLS) enabled with restrictive access policies.

## Project Structure

```
/app
  /(auth)              # Authentication screens
    ├── login.tsx      # Email/password login
    ├── signup.tsx     # Registration
    └── _layout.tsx    # Auth navigation
  /(tabs)              # Main app tabs
    ├── index.tsx      # Home dashboard
    ├── feed.tsx       # Church social feed
    ├── groups.tsx     # Community groups
    ├── serve.tsx      # Volunteer coordination
    ├── profile.tsx    # User profile & settings
    ├── messages.tsx   # Private messaging
    ├── events.tsx     # Event management
    ├── give.tsx       # Giving/donation
    ├── media.tsx      # Sermons & teaching
    └── _layout.tsx    # Tab navigation
  ├── +not-found.tsx   # 404 page
  └── _layout.tsx      # Root layout with auth provider

/context
  └── AuthContext.tsx  # Authentication state management

/lib
  └── supabase.ts      # Supabase client instance

/hooks
  └── useFrameworkReady.ts # Framework initialization
```

## Core Features

### 1. Authentication (Login/Signup)
- Email/password registration and login
- User profile creation
- Session management
- Automatic redirect based on authentication state

### 2. Home Dashboard
- Personalized greeting
- Quick action cards (Prayer, Give, Groups, Events)
- Upcoming events list
- Church announcements
- Daily engagement prompts

### 3. Church Feed (Social Core)
- View posts from church community
- Support multiple post types: text, scripture, photo, video, prayer, poll, testimony
- Like and comment on posts
- Save posts for later
- Real-time engagement stats

### 4. Groups & Community
- Browse public groups
- View groups you've joined
- See group membership and descriptions
- Explore different ministry groups
- Join groups with one tap

### 5. Serving (Volunteer Hub)
- View current serving commitments
- Browse available volunteer roles
- Accept new serving opportunities
- Track serving schedule and history
- Get push reminders for commitments

### 6. Events Management
- Browse upcoming church events
- RSVP to events
- View event details (date, time, location, capacity)
- Check attendee list
- Calendar integration ready

### 7. Private Messaging
- 1:1 private conversations
- Group chat threads
- Read receipts
- Message history
- Quick communication for coordination

### 8. Giving (Generosity)
- One-time and recurring giving options
- Multiple campaign support
- Quick amount selections
- Custom donation amounts
- Giving history tracking
- Campaign-specific giving

### 9. Prayer & Care
- Submit public/private prayer requests
- Mark when you've prayed for someone
- View urgent prayer needs
- Community prayer support
- Prayer update tracking

### 10. Media & Teaching
- Sermon library with video/audio
- Series filtering
- Speaker information
- Teaching dates
- Offline download capability (architecture ready)

### 11. Profile & Settings
- Edit user profile
- View member information
- Manage notifications
- Privacy settings
- Household linking
- Account management

## Key Design Decisions

### Privacy First
- All tables use Row-Level Security
- Members can only see appropriate data
- Group-specific content is private by default
- Prayer requests can be marked as private
- Household information is private

### Mobile-First
- Touch-optimized interface
- Minimal scrolling required
- Quick-access action buttons
- Mobile-appropriate typography
- Responsive layout for all screen sizes

### Community-Centric
- Focus on member connection over announcements
- Group-based organization
- Social features promote engagement
- Peer-to-peer communication encouraged
- Emphasis on belonging, not just attendance

### Performance
- Indexed database queries for speed
- Efficient data fetching
- Refresh-on-demand patterns
- Lazy loading where appropriate
- Optimized component rendering

## Authentication Flow

1. **First Time**:
   - User sees login/signup screen
   - Creates account with email and password
   - Profile is automatically created
   - Gets assigned 'member' role
   - Redirected to Home tab

2. **Subsequent Logins**:
   - Session persists using Supabase auth
   - User data loads from profiles table
   - Roles are determined from user_roles table
   - Permissions applied via RLS policies

3. **Logout**:
   - Session cleared
   - Returns to auth screen
   - Local data cleared

## Database Security

### Row-Level Security Policies
All tables implement the following principle:
- **SELECT**: Only see data you own or have permission for
- **INSERT**: Only insert data as yourself
- **UPDATE**: Only update your own data
- **DELETE**: Only delete your own data

Leader/staff roles have additional permissions for moderation and management.

### Sensitive Data Handling
- Passwords: Handled by Supabase auth (never stored in app)
- Private messages: RLS ensures only participants can view
- Prayer requests: Can be marked private
- Giving records: Only visible to the giver
- Personal info: Controlled by privacy settings

## API Integration Points

The app is structured to easily add:
- Stripe/payment processing (for giving)
- Push notifications (Expo Notifications)
- Calendar sync (Expo Calendar)
- Camera features (Expo Camera)
- Image uploads (Supabase Storage)

## Getting Started

### Environment Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Type check
npm run typecheck

# Lint check
npm run lint
```

### Required Environment Variables
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Development Flow
1. Make code changes
2. Run `npm run typecheck` to catch type errors
3. Run `npm run lint` to check code quality
4. Test in Expo app on phone or web

## Feature Highlights

### 🏠 Home Tab
- Personalized dashboard
- Quick access to main features
- Event notifications
- Announcement section
- Daily engagement stats

### 📖 Feed Tab
- Chronological church-wide posts
- Multiple post types support
- Rich engagement (likes, comments, saves)
- Prayer request integration
- Testimony sharing

### 👥 Groups Tab
- Discover new groups
- Browse ministries
- View group members
- Group-specific posts
- Ministry organization

### 💪 Serve Tab
- Current commitments
- Available volunteer roles
- Schedule management
- Training resources
- Availability settings

### 🙏 Prayer Tab (Modal)
- Submit prayer requests
- Public/private options
- Mark as urgent
- Community prayer
- Prayer update tracking

### 💝 Give Tab (Modal)
- Campaign-based giving
- Quick amounts
- Recurring donations
- Giving history
- Impact tracking

### 📱 Messages Tab (Modal)
- Direct messaging
- Group conversations
- Quick coordination
- Conversation history
- Notification integration

### 📹 Media Tab (Modal)
- Sermon library
- Series organization
- Teaching resources
- Speaker information
- Download capability

### 👤 Profile Tab
- User information
- Settings management
- Notification preferences
- Privacy controls
- Account management

## Future Enhancements

Potential features to add:
- Real-time notifications
- Attendance tracking with QR codes
- Bible study notes
- Volunteer scheduling calendar
- Mentorship matching
- Small group leader tools
- Analytics dashboard
- Video calls for prayer
- Livestream integration
- Member directory
- Service requests
- Community help board

## Performance Considerations

- Database indexes on frequently queried columns
- Efficient join queries
- Pagination for large lists
- Optimized image loading
- Lazy component rendering
- Memoized expensive computations

## Accessibility

- Large touch targets
- Clear visual hierarchy
- High contrast ratios
- Clear error messaging
- Intuitive navigation
- Readable typography

## Testing

The app includes:
- TypeScript type checking
- ESLint code quality checks
- Component-level error handling
- Error boundaries ready for implementation

## Deployment

For production deployment:
1. Build with `expo build:ios` or `expo build:android`
2. Configure environment variables for production
3. Set up App Store/Google Play credentials
4. Enable Supabase production mode
5. Configure domain/redirect URLs

## Support & Troubleshooting

### Common Issues

**Login not working**:
- Verify Supabase credentials in .env
- Check that user has confirmed email (if enabled)
- Verify RLS policies aren't blocking access

**Posts not loading**:
- Check RLS policies on posts table
- Verify user has group membership if post is in group
- Check database for actual data

**Push notifications not working**:
- Enable permissions on device
- Check Expo Push notification configuration
- Verify notification channels are set up

## Code Quality Standards

- TypeScript for type safety
- ESLint for code consistency
- React hooks best practices
- Component modularity
- Clear naming conventions
- Documented complex logic
- Error handling throughout

## License & Attribution

Built with:
- React Native & Expo
- Supabase
- Lucide icons
- Pexels stock photos

## Support

For questions about implementation:
1. Check TypeScript types for API usage
2. Review Supabase documentation
3. Examine existing components as examples
4. Test in development mode with detailed logging