import { getCurrentWindow } from "@tauri-apps/api/window";

export class WindowManager {
    private isAlwaysOnTop: boolean = false;

    async toggleAlwaysOnTop(): Promise<boolean> {
        try {
            const window = getCurrentWindow();
            this.isAlwaysOnTop = !this.isAlwaysOnTop;
            await window.setAlwaysOnTop(this.isAlwaysOnTop);
            return this.isAlwaysOnTop;
        } catch (error) {
            console.error("Failed to toggle always on top:", error);
            throw error;
        }
    }

    isAlwaysOnTopEnabled(): boolean {
        return this.isAlwaysOnTop;
    }

    async setAlwaysOnTop(enabled: boolean): Promise<void> {
        try {
            const window = getCurrentWindow();
            this.isAlwaysOnTop = enabled;
            await window.setAlwaysOnTop(enabled);
        } catch (error) {
            console.error("Failed to set always on top:", error);
            throw error;
        }
    }
}
