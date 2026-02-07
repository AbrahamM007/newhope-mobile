export const MOCK_GROUPS = [
    {
        id: 'worship',
        name: 'Worship Team',
        description: 'Lead the congregation in praise and worship.',
        image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80',
        type: 'team',
        powerUp: 'planning',
        _count: { members: 24 },
    },
    {
        id: 'ushers',
        name: 'Ushers & Greeters',
        description: 'Welcome guests and help them find their seats.',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80',
        type: 'team',
        powerUp: 'rostering',
        _count: { members: 45 },
    },
    {
        id: 'kids',
        name: 'Kids Ministry',
        description: 'Teaching the next generation about Jesus.',
        image: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&q=80',
        type: 'team',
        powerUp: 'checkin',
        _count: { members: 32 },
    },
];

export const MOCK_SERVICES = [
    {
        id: 'svc_1',
        date: '2026-02-15',
        time: '9:00 AM',
        title: 'Sunday Service',
        series: 'Walking in Faith',
        status: 'Confirmed',
    },
    {
        id: 'svc_2',
        date: '2026-02-15',
        time: '11:00 AM',
        title: 'Sunday Service',
        series: 'Walking in Faith',
        status: 'Draft',
    },
    {
        id: 'svc_3',
        date: '2026-02-22',
        time: '9:00 AM',
        title: 'Sunday Service',
        series: 'The Kingdom',
        status: 'Draft',
    },
];

export const MOCK_PLANS = {
    'svc_1': [
        { type: 'header', title: 'Pre-Service' },
        { type: 'song', id: 's1', title: 'Graves Into Gardens', key: 'B', bpm: 70, duration: '5:30', artist: 'Elevation Worship' },
        { type: 'song', id: 's2', title: 'Goodness of God', key: 'Ab', bpm: 68, duration: '4:45', artist: 'Bethel Music' },
        { type: 'header', title: 'Service Start' },
        { type: 'item', title: 'Welcome & Announcements', duration: '3:00', assignee: 'Pastor John' },
        { type: 'song', id: 's3', title: 'Way Maker', key: 'E', bpm: 68, duration: '6:15', artist: 'Sinach' },
        { type: 'header', title: 'Sermon' },
        { type: 'item', title: 'Message: Walking in Faith', duration: '35:00', assignee: 'Pastor John' },
    ]
};

export const MOCK_TEAM_ASSIGNMENTS = {
    'svc_1': [
        { role: 'Worship Leader', name: 'Sarah J.', status: 'Accepted' },
        { role: 'Acoustic Guitar', name: 'Mike T.', status: 'Accepted' },
        { role: 'Keys', name: 'David L.', status: 'Pending' },
        { role: 'Drums', name: 'Chris R.', status: 'Declined' },
        { role: 'Bass', name: 'Alex P.', status: 'Accepted' },
    ]
};
