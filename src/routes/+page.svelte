<script lang="ts">
    import {
        BrushCleaningIcon,
        ClipboardPenIcon,
        PinIcon,
    } from "lucide-svelte";
    import { SegmentedControl } from "@skeletonlabs/skeleton-svelte";
    import Notify from "../components/notify.svelte";
    import KittyUrl from "../components/kitty.svg?url";
    import { invoke } from "@tauri-apps/api/core";
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import "../global.css";
    import { writeText, readText } from "@tauri-apps/plugin-clipboard-manager";
    import { onDestroy } from "svelte";

    const LISTEN_MODE = {
        NO_BILL_PACKAGE: "NO_BILL_PACKAGE",
        NO_BILL: "NO_BILL",
    };

    const separators = ["_", "转"];

    const converters = [
        {
            label: "不要包装 & 小票",
            prefix: " 不 要 包 装 ",
            suffix: " 扔 掉 小 票 ",
            listenType: LISTEN_MODE.NO_BILL_PACKAGE,
        },
        {
            label: "扔掉小票",
            suffix: " 扔 掉 小 票 ",
            listenType: LISTEN_MODE.NO_BILL,
        },
    ];

    let contact = "";
    let notifies: { message: string; createdAt: Date }[] = [];
    let isListen: boolean = false;
    let currentListenType = LISTEN_MODE.NO_BILL;
    let pollingInterval: number | null = null;
    let lastClipboardContent: string = "";
    let isAlwaysOnTop: boolean = false;

    function handleReset() {
        contact = "";
        notifies = [];
        if (isListen) {
            stopPolling();
            isListen = false;
            pushNotify("已停止监听");
        }
    }

    async function handleConvert(convert: { prefix: string; suffix: string }) {
        try {
            const result: string = await invoke("handle_convert", {
                value: contact,
                separators: separators,
                prefix: convert.prefix,
                suffix: convert.suffix,
            });

            await writeText(result);

            pushNotify(result);
        } catch (error: any) {
            pushNotify(error?.toString());
        }
    }

    function pushNotify(message: string) {
        notifies = [
            {
                message: message,
                createdAt: new Date(),
            },
            ...notifies,
        ];
    }

    function validateContact(contact: string, separators: string[]): boolean {
        const trimmed = contact.trim();

        for (const separator of separators) {
            const separatorIndex = trimmed.indexOf(separator);
            if (separatorIndex === 11 && trimmed.length === 16) {
                let digitsValid = true;

                for (let i = 0; i < 11; i++) {
                    if (trimmed[i] < "0" || trimmed[i] > "9") {
                        digitsValid = false;
                        break;
                    }
                }

                for (let i = 12; i < 16; i++) {
                    if (trimmed[i] < "0" || trimmed[i] > "9") {
                        digitsValid = false;
                        break;
                    }
                }

                if (digitsValid) return true;
            }
        }

        return false;
    }

    async function startPolling() {
        try {
            lastClipboardContent = (await readText()) || "";
        } catch (error) {
            pushNotify(`初始化剪切板失败: ${error}`);
            return false;
        }

        pollingInterval = setInterval(async () => {
            try {
                const currentContent = (await readText()) || "";

                if (
                    currentContent !== lastClipboardContent &&
                    currentContent &&
                    currentContent.trim() !== ""
                ) {
                    lastClipboardContent = currentContent;

                    if (validateContact(currentContent, separators)) {
                        const converter = converters.find(
                            (c) => c.listenType === currentListenType,
                        );
                        if (converter) {
                            const result: string = await invoke(
                                "handle_convert",
                                {
                                    value: currentContent,
                                    separators: separators,
                                    prefix: converter.prefix || "",
                                    suffix: converter.suffix || "",
                                },
                            );

                            await writeText(result);
                            pushNotify(`自动转换成功: ${result}`);
                        }
                    }
                }
            } catch (error: any) {
                console.error("剪切板轮询错误:", error);
            }
        }, 500);

        return true;
    }

    function stopPolling() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    }

    async function toggleAlwaysOnTop() {
        try {
            const window = getCurrentWindow();
            isAlwaysOnTop = !isAlwaysOnTop;
            await window.setAlwaysOnTop(isAlwaysOnTop);
            pushNotify(isAlwaysOnTop ? "已开启置顶" : "已关闭置顶");
        } catch (error: any) {
            pushNotify(`设置置顶失败: ${error}`);
        }
    }

    onDestroy(() => {
        stopPolling();
    });
</script>

<main class="grid grid-rows-[auto_1fr_auto] h-screen">
    <header class="px-4 py-2 pt-4 flex flex-col gap-2">
        {#if isListen}
            <SegmentedControl
                defaultValue={currentListenType}
                class="flex-1"
                onValueChange={(detail) => {
                    pushNotify(`更换监听模式为: ${detail.value}`);
                    currentListenType = detail.value || "";
                }}
            >
                <SegmentedControl.Control>
                    <SegmentedControl.Indicator />
                    {#each converters as converter}
                        <SegmentedControl.Item
                            value={converter.listenType || ""}
                        >
                            <SegmentedControl.ItemText>
                                {converter.label}
                            </SegmentedControl.ItemText>
                            <SegmentedControl.ItemHiddenInput />
                        </SegmentedControl.Item>
                    {/each}
                </SegmentedControl.Control>
            </SegmentedControl>
        {:else}
            <div class="flex flex-row items-center gap-2">
                <button
                    type="button"
                    class="btn-icon preset-filled"
                    title="重置"
                    onclick={handleReset}
                >
                    <BrushCleaningIcon size={14} />
                </button>
                <label class="label" for="contact">
                    <input
                        class="input"
                        type="text"
                        bind:value={contact}
                        placeholder="联系方式"
                    />
                </label>
            </div>

            <div class="flex flex-row gap-2">
                {#each converters as converter}
                    <button
                        class="btn preset-filled flex-1"
                        title={converter.label}
                        onclick={() =>
                            handleConvert({
                                prefix: converter.prefix || "",
                                suffix: converter.suffix || "",
                            })}
                    >
                        {converter.label}
                    </button>
                {/each}
            </div>
        {/if}
    </header>

    <div class="col-span-1 px-4 pb-4 flex flex-col min-h-0">
        <div
            class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover
            divide-surface-200-800 block overflow-hidden p-2 text-sm flex-1 flex flex-col gap-2 overflow-y-auto"
        >
            {#if notifies.length === 0}
                <div
                    class="flex-1 flex items-center justify-center text-surface-500-500"
                >
                    <div class="text-center">
                        <div
                            class="text-md mb-2 cursor-pointer hover:scale-110 transition-transform"
                        >
                            <img
                                src={KittyUrl}
                                alt="Kitty"
                                class="hover:scale-105 transition-transform"
                            />
                        </div>
                    </div>
                </div>
            {:else}
                <div class="flex flex-col gap-2">
                    {#each notifies as notify (notify.createdAt.getTime() + "-" + notify.message)}
                        <Notify
                            message={notify.message}
                            createdAt={notify.createdAt}
                        />
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <button
        type="button"
        class="fixed bottom-16 right-6 btn-icon preset-filled"
        class:bg-surface-400={isAlwaysOnTop}
        title="置顶"
        onclick={toggleAlwaysOnTop}
    >
        <PinIcon />
    </button>

    <button
        type="button"
        class="fixed bottom-6 right-6 btn-icon preset-filled"
        class:bg-surface-400={isListen}
        title="监听模式"
        onclick={async () => {
            if (!isListen) {
                const started = await startPolling();
                if (started) {
                    pushNotify("开始监听...");
                    isListen = true;
                }
            } else {
                stopPolling();
                pushNotify("停止监听...");
                isListen = false;
            }
        }}
    >
        <ClipboardPenIcon />
    </button>
</main>
