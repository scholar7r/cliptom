import { readText, writeText } from "@tauri-apps/plugin-clipboard-manager";

export class ClipboardManager {
    private lastContent: string = "";
    private intervalId: number | null = null;

    async initialize(): Promise<boolean> {
        try {
            this.lastContent = (await readText()) || "";
            return true;
        } catch (error) {
            console.error("Failed to initialize clipboard:", error);
            return false;
        }
    }

    async readContent(): Promise<string> {
        try {
            return (await readText()) || "";
        } catch (error) {
            console.error("Failed to read clipboard:", error);
            return "";
        }
    }

    async writeContent(content: string): Promise<void> {
        try {
            await writeText(content);
            this.lastContent = content;
        } catch (error) {
            console.error("Failed to write clipboard:", error);
            throw error;
        }
    }

    getLastContent(): string {
        return this.lastContent;
    }

    updateLastContent(content: string): void {
        this.lastContent = content;
    }

    startPolling(callback: (content: string) => void, interval: number = 500): void {
        if (this.intervalId !== null) return;

        this.intervalId = setInterval(async () => {
            try {
                const currentContent = await this.readContent();

                if (
                    currentContent !== this.lastContent &&
                    currentContent &&
                    currentContent.trim() !== ""
                ) {
                    this.lastContent = currentContent;
                    callback(currentContent);
                }
            } catch (error) {
                console.error("Clipboard polling error:", error);
            }
        }, interval) as unknown as number;
    }

    stopPolling(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    isActive(): boolean {
        return this.intervalId !== null;
    }

    destroy(): void {
        this.stopPolling();
    }
}
