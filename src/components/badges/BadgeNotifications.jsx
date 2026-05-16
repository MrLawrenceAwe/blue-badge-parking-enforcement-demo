export function BadgeNotifications({ notifications }) {
  return (
    <div className="timeline-list badge-notifications">
      <h3>Notifications</h3>
      {notifications.map((notification) => (
        <small key={notification.id}>
          {notification.channel} at {new Date(notification.time).toLocaleString('en-GB')}: {notification.message}
        </small>
      ))}
      {!notifications.length && <small>No notifications for this badge.</small>}
    </div>
  );
}
