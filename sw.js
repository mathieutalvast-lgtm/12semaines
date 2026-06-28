// ══════════════════════════════════════════════
// SERVICE WORKER — Force & Performance
// ══════════════════════════════════════════════
const CACHE = 'fp-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// ── PUSH NOTIFICATIONS ──
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '💪 Force & Performance';
  const options = {
    body: data.body || 'Ta séance t\'attend !',
    icon: data.icon || '/12semaines/icon.png',
    badge: data.badge || '/12semaines/icon.png',
    tag: data.tag || 'fp-notif',
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url || '/12semaines/' },
    actions: [
      { action: 'open', title: '🏋️ Voir la séance' },
      { action: 'dismiss', title: 'Plus tard' }
    ]
  };
  e.waitUntil(self.registration.showNotification(title, options));
});

// ── NOTIFICATION CLICK ──
self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const url = e.notification.data?.url || '/12semaines/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('12semaines') && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── SCHEDULED NOTIFICATIONS (via setInterval trick) ──
// Since we can't use cron in SW, we use a periodic check
self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_CHECK') {
    checkScheduledNotifications(e.data.schedule);
  }
});

function checkScheduledNotifications(schedule) {
  if (!schedule) return;
  const now = new Date();
  const day = now.getDay(); // 0=dim, 1=lun...
  const hour = now.getHours();
  const min = now.getMinutes();

  const DAYS = {
    1: { label: 'PUSH', emoji: '🏋️', msg: 'Séance PUSH — Pecto · Épaules · Triceps' },
    2: { label: 'ENDURANCE', emoji: '🏃', msg: 'Endurance Zone 2 — 45 minutes à rythme facile' },
    3: { label: 'PULL', emoji: '💪', msg: 'Séance PULL — Dos · Biceps · Épaules post.' },
    4: { label: 'FRACTIONNÉ', emoji: '⚡', msg: 'Fractionné — 10×1 min · Donne tout !' },
    5: { label: 'UPPER', emoji: '🔥', msg: 'Séance UPPER COMPLET — Haut du corps intégral' },
    6: { label: 'SORTIE LONGUE', emoji: '🌄', msg: 'Sortie longue — 60 à 90 min à allure facile' },
    0: { label: 'REPOS', emoji: '🧘', msg: 'Mobilité 10 min — Non négociable !' },
  };

  const notifHour = parseInt(schedule.hour) || 7;
  const notifMin = parseInt(schedule.minute) || 0;

  if (hour === notifHour && min === notifMin) {
    const todaySession = DAYS[day];
    if (!todaySession) return;
    const title = `${todaySession.emoji} ${todaySession.label} aujourd'hui !`;
    self.registration.showNotification(title, {
      body: todaySession.msg,
      icon: '/12semaines/icon.png',
      tag: 'fp-daily-' + day,
      vibrate: [300, 100, 300],
      data: { url: '/12semaines/' }
    });
  }
}
