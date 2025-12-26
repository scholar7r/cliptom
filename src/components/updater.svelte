<script lang="ts">
    import { Dialog, Portal } from "@skeletonlabs/skeleton-svelte";
    import { XIcon, DownloadIcon } from "lucide-svelte";
    import type { Update } from "@tauri-apps/plugin-updater";

    interface Props {
        version: string;
        body: string;
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
        update: Update | null;
    }

    let { version, body, open = false, onOpenChange, update }: Props = $props();

    let isOpen = $state(false);
    let isDownloading = $state(false);
    let downloadProgress = $state(0);
    let isInstalling = $state(false);

    $effect(() => {
        isOpen = open;
    });

    async function handleUpdate() {
        if (!update) return;

        try {
            isDownloading = true;
            downloadProgress = 0;

            let downloaded = 0;
            let contentLength = 0;

            await update.downloadAndInstall((event) => {
                switch (event.event) {
                    case "Started":
                        contentLength = event.data.contentLength || 0;
                        console.info(
                            `started downloading ${event.data.contentLength} bytes`,
                        );
                        break;
                    case "Progress":
                        downloaded += event.data.chunkLength;
                        if (contentLength > 0) {
                            downloadProgress = Math.round(
                                (downloaded / contentLength) * 100,
                            );
                        }
                        console.info(
                            `downloaded ${downloaded} from ${contentLength}`,
                        );
                        break;
                    case "Finished":
                        console.info("download finished");
                        isDownloading = false;
                        isInstalling = true;
                        break;
                }
            });

            console.info("update installed");
        } catch (error) {
            console.error("Update failed:", error);
            isDownloading = false;
            isInstalling = false;
        }
    }
</script>

<Dialog open={isOpen} onOpenChange={(detail) => onOpenChange?.(detail.open)}>
    <Portal>
        <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
        <Dialog.Positioner
            class="fixed inset-0 z-50 flex justify-center items-center p-4"
        >
            <Dialog.Content
                class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4
                shadow-xl transition transition-discrete opacity-0 translate-y-[100px]
                starting:data-[state=open]:opacity-0starting:data-[state=open]:translate-y-[100px]
                data-[state=open]:opacity-100 data-[state=open]:translate-y-0"
            >
                <header class="flex justify-between items-center">
                    <Dialog.Title class="text-lg font-bold">
                        新版已发布
                        <button class="chip preset-tonal" disabled>
                            {version}
                        </button>
                    </Dialog.Title>
                    <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                        <XIcon class="size-4" />
                    </Dialog.CloseTrigger>
                </header>
                <div class="flex flex-col gap-2">
                    <Dialog.Description>
                        {body}
                    </Dialog.Description>
                </div>
                <footer class="flex flex-col gap-3">
                    {#if isDownloading}
                        <div class="flex flex-col gap-2">
                            <div class="flex justify-between text-sm">
                                <span>下载中...</span>
                                <span>{downloadProgress}%</span>
                            </div>
                            <div
                                class="h-2 bg-surface-200-800 rounded-full overflow-hidden"
                            >
                                <div
                                    class="h-full bg-primary-500 transition-all duration-300"
                                    style="width: {downloadProgress}%"
                                ></div>
                            </div>
                        </div>
                    {:else if isInstalling}
                        <div class="flex justify-center text-sm">安装中...</div>
                    {/if}

                    <div class="flex justify-end gap-2">
                        <Dialog.CloseTrigger
                            class="btn preset-tonal"
                            disabled={isDownloading || isInstalling}
                        >
                            取消
                        </Dialog.CloseTrigger>
                        <button
                            type="button"
                            class="btn preset-filled"
                            onclick={handleUpdate}
                            disabled={isDownloading || isInstalling}
                        >
                            {#if isDownloading || isInstalling}
                                <DownloadIcon class="size-4 animate-spin" />
                            {:else}
                                更新
                            {/if}
                        </button>
                    </div>
                </footer>
            </Dialog.Content>
        </Dialog.Positioner>
    </Portal>
</Dialog>
