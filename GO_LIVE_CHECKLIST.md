# Go-Live Checklist

## Pre-Deployment (Do These First)

### Setup Supabase Storage (5 minutes)
- [ ] Go to [Supabase Dashboard](https://app.supabase.com)
- [ ] Select your project
- [ ] Navigate to **Storage** (left sidebar)
- [ ] Click **Create a new bucket**
- [ ] Name: `media`
- [ ] **IMPORTANT**: Toggle **Make it public**
- [ ] Click **Create bucket**

### Install Dependencies
```bash
npm install
```
- [ ] Command completes successfully
- [ ] `expo-image-picker@~15.0.5` appears in node_modules

### Test Locally
```bash
npm run dev
```
- [ ] App starts successfully
- [ ] Scan QR with Expo Go app
- [ ] App loads in Expo Go

### Test Media Upload
1. [ ] Sign up / login
2. [ ] Go to Social tab
3. [ ] Create a post
4. [ ] Tap "Add Media" button
5. [ ] Take a photo or select from camera roll
6. [ ] Image should upload
7. [ ] Preview should appear
8. [ ] Complete post and save
9. [ ] Post with image should appear in feed

### Test Chat System
1. [ ] Send DM to test user
2. [ ] Send message in group chat
3. [ ] Verify message badges (DM • GROUP)
4. [ ] Test muting a conversation
5. [ ] Verify quiet hours setting

## Deployment

### Build Web Version
```bash
npm run build:web
```
- [ ] Build completes without errors
- [ ] Output folder created

### Deploy Web
- [ ] Deploy to Vercel / Netlify / hosting service
- [ ] Test all features in production
- [ ] Verify Supabase connection works
- [ ] Test image uploads in production

### Build Mobile (Optional)
```bash
eas build
```
- [ ] Build completes
- [ ] APK/IPA generated
- [ ] Test on device

## Admin Setup

### Create Admin Account
- [ ] Create account with admin email
- [ ] Set as SUPER_ADMIN in database

### Configure Default Groups
- [ ] Verify default core groups exist:
  - Leadership
  - Elders
  - Worship Team
  - Kids Ministry
  - Youth Ministry
  - Ushers
  - Welcome Team
  - Production Team

### Configure Ministries
- [ ] Create ministries if needed:
  - Worship
  - Children's Ministry
  - Youth Ministry
  - Production
  - Ushers
  - etc.

### Train Admin
- [ ] Admin can create groups
- [ ] Admin can create announcements
- [ ] Admin can assign volunteers
- [ ] Admin can create events
- [ ] Admin understands chat system

## User Testing

### Onboard First Users
- [ ] 5-10 test users created
- [ ] Test user can sign up
- [ ] Test user can complete profile
- [ ] Test user can join group
- [ ] Test user can send message

### Test Each Feature
- [ ] Home tab shows content
- [ ] Social feed displays posts
- [ ] Can create post with text
- [ ] Can upload image in post
- [ ] Can upload video in post
- [ ] Can react to posts
- [ ] Can comment on posts
- [ ] Can message users
- [ ] Can join groups
- [ ] Can accept serving request
- [ ] Can RSVP to event
- [ ] Can create prayer request
- [ ] Can give to campaign
- [ ] Can view sermon library
- [ ] Can bookmark sermon
- [ ] Can set notification preferences

### Test Admin Functions
- [ ] Can create announcement
- [ ] Can add member to group
- [ ] Can remove member from group
- [ ] Can create event
- [ ] Can create service
- [ ] Can assign volunteer

## Performance & Stability

### Performance Testing
- [ ] App loads in < 3 seconds
- [ ] Feed scrolls smoothly
- [ ] Chat responds immediately
- [ ] Messages send quickly
- [ ] No lag on image upload

### Stability Testing
- [ ] App doesn't crash
- [ ] No console errors
- [ ] Can use for 30+ minutes continuously
- [ ] Handles network interruptions
- [ ] Works online and offline (where applicable)

### Load Testing
- [ ] 10+ users online simultaneously
- [ ] Create multiple posts simultaneously
- [ ] Send multiple messages simultaneously
- [ ] No database errors

## Security Verification

### Security Checks
- [ ] Users cannot see other users' DMs
- [ ] Users cannot see group content they're not in
- [ ] Unverified members cannot post
- [ ] Leaders can only moderate their own groups
- [ ] Admin can see all content (as designed)

### Data Privacy
- [ ] User passwords not stored in logs
- [ ] Tokens stored securely
- [ ] No sensitive data exposed
- [ ] User data properly isolated

## Documentation

### Verify Documentation
- [ ] README_START_HERE.md complete
- [ ] COMPLETE_APP_GUIDE.md accessible
- [ ] MEDIA_STORAGE_SETUP.md accurate
- [ ] All guides spell-checked

### User Support
- [ ] Support email configured
- [ ] Help documentation accessible
- [ ] FAQ written
- [ ] Troubleshooting guide available

## Monitoring Setup

### Production Monitoring
- [ ] Supabase logs viewable
- [ ] Error tracking enabled
- [ ] Performance metrics collected
- [ ] Alerts configured

### Backup & Recovery
- [ ] Database backups enabled
- [ ] Recovery plan documented
- [ ] Disaster recovery tested

## Launch Day

### Final Checks (Launch Day)
- [ ] All team members notified
- [ ] Support staff trained
- [ ] Backup plan ready
- [ ] Monitoring active
- [ ] All systems green

### Go Live
- [ ] Deploy to production
- [ ] Monitor first hour closely
- [ ] Have rollback plan ready
- [ ] Support team standing by

### Post-Launch
- [ ] Collect user feedback
- [ ] Monitor error logs
- [ ] Fix any critical issues immediately
- [ ] Release patch if needed

## Post-Launch (First Week)

### User Feedback
- [ ] Collect feedback from first users
- [ ] Address top issues
- [ ] Gather feature requests
- [ ] Plan Phase 2 features

### Performance Monitoring
- [ ] Monitor database performance
- [ ] Check storage usage
- [ ] Verify backup completion
- [ ] Review analytics

### User Growth
- [ ] Onboard bulk users if planned
- [ ] Monitor system load
- [ ] Scale resources if needed
- [ ] Plan infrastructure updates

---

## Status After Each Phase

### ✅ Pre-Deployment Complete
- Storage bucket created
- Dependencies installed
- Tested locally successfully

### ✅ Deployment Complete
- App running in production
- All features accessible
- Users can upload media
- Chat system working

### ✅ Admin Setup Complete
- Default groups configured
- Admin trained
- Ready for users

### ✅ User Testing Complete
- All features verified
- No critical issues
- Ready for launch

### ✅ Performance Verified
- App fast and stable
- Load tested
- Monitoring active

### ✅ Security Verified
- Access control working
- Data properly isolated
- No vulnerabilities

### ✅ Go Live Complete
- App live in production
- Users onboarded
- Support ready

---

## Emergency Contacts

**Issues Encountered?**
1. Check Supabase dashboard for errors
2. Review app console logs
3. Check internet connection
4. Try clearing app cache
5. Restart app

**Need Help?**
- See MEDIA_STORAGE_SETUP.md for media issues
- See COMPLETE_APP_GUIDE.md for feature questions
- See CHAT_SYSTEM_GUIDE.md for chat issues

---

**Checklist Status**: Ready to go live
**Date**: 2026-02-08
**Version**: 1.0.0
