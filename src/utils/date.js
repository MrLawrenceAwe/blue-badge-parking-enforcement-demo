export function minutesBetween(firstDate, secondDate) {
  return Math.abs((new Date(firstDate).getTime() - new Date(secondDate).getTime()) / 60000);
}

export function timestampNow() {
  return new Date().toISOString();
}

export function timestampMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60000).toISOString();
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function formatTime(value) {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
