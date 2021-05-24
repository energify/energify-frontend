import { writable } from "svelte/store";
import type { Notification } from "../interfaces/notifications.interfaces";

export class NotificationService {
  notifications = writable(new Array<Notification>());

  push(notification: Notification) {
    this.notifications.update((n) => [...n, notification]);
  }

  clearByIndex(index: number) {
    this.notifications.update((n) => n.filter((_, i) => i !== index));
  }
}
