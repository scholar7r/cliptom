import { writable } from 'svelte/store';

export interface Notification {
    message: string;
    createdAt: Date;
}

export class NotificationManager {
    private notifications = writable<Notification[]>([]);

    subscribe(callback: (value: Notification[]) => void) {
        return this.notifications.subscribe(callback);
    }

    add(message: string): void {
        this.notifications.update(current => [
            {
                message: message,
                createdAt: new Date(),
            },
            ...current,
        ]);
    }

    getAll(): Notification[] {
        let result: Notification[] = [];
        this.notifications.subscribe(value => result = value)();
        return result;
    }

    clear(): void {
        this.notifications.set([]);
    }

    isEmpty(): boolean {
        let result = true;
        this.notifications.subscribe(value => result = value.length === 0)();
        return result;
    }

    getCount(): number {
        let result = 0;
        this.notifications.subscribe(value => result = value.length)();
        return result;
    }
}
