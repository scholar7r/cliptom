<script lang="ts">
    import { BrushCleaningIcon, ClipboardPenIcon } from "lucide-svelte";
    import { SegmentedControl } from "@skeletonlabs/skeleton-svelte";
    import Notify from "../components/notify.svelte";
    import KittyUrl from "../components/kitty.svg?url";
    import "../global.css";
    import { ClipboardManager } from "../services/ClipboardManager";
    import { ContactValidator } from "../services/ContactValidator";
    import {
        ConverterManager,
        type ConverterConfig,
    } from "../services/ConverterManager";
    import { NotificationManager } from "../services/NotificationManager";

    const LISTEN_MODE = {
        NO_BILL_PACKAGE: "NO_BILL_PACKAGE",
        NO_BILL: "NO_BILL",
    };

    const separators = ["_", "转"];

    const converters: ConverterConfig[] = [
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
    let currentListenType = LISTEN_MODE.NO_BILL;
    let notifies: { message: string; createdAt: Date }[] = [];

    const clipboardManager = new ClipboardManager();
    const contactValidator = new ContactValidator(separators);
    const converterManager = new ConverterManager(separators, converters);
    const notificationManager = new NotificationManager();

    notificationManager.subscribe((notifications) => {
        notifies = notifications;
    });

    function handleReset() {
        contact = "";
        notificationManager.clear();
        if (clipboardManager.isActive()) {
            clipboardManager.stopPolling();
            notificationManager.add("已停止监听");
        }
    }

    async function handleConvert(convert: { prefix: string; suffix: string }) {
        try {
            const result = await converterManager.convert(contact, {
                label: "",
                prefix: convert.prefix,
                suffix: convert.suffix,
                listenType: "",
            });
            await clipboardManager.writeContent(result);
            notificationManager.add(result);
        } catch (error: any) {
            notificationManager.add(error?.toString());
        }
    }

    async function startPolling() {
        const initialized = await clipboardManager.initialize();
        if (!initialized) {
            notificationManager.add("初始化剪切板失败");
            return false;
        }

        clipboardManager.startPolling(async (content) => {
            if (contactValidator.validate(content)) {
                const converter =
                    converterManager.getConverterByType(currentListenType);
                if (converter) {
                    try {
                        const result = await converterManager.convert(
                            content,
                            converter,
                        );
                        await clipboardManager.writeContent(result);
                        notificationManager.add(`自动转换成功: ${result}`);
                    } catch (error: any) {
                        notificationManager.add(
                            `转换失败: ${error?.toString()}`,
                        );
                    }
                }
            }
        });

        return true;
    }
</script>

<main class="grid grid-rows-[auto_1fr_auto] h-screen">
    <header class="px-4 py-2 pt-4 flex flex-col gap-2">
        {#if clipboardManager.isActive()}
            <SegmentedControl
                defaultValue={currentListenType}
                class="flex-1"
                onValueChange={(detail) => {
                    notificationManager.add(`更换监听模式为: ${detail.value}`);
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
        class="fixed bottom-6 right-6 btn-icon preset-filled"
        class:bg-surface-400={clipboardManager.isActive()}
        title="监听模式"
        onclick={async () => {
            if (!clipboardManager.isActive()) {
                const started = await startPolling();
                if (started) {
                    notificationManager.add("开始监听...");
                }
            } else {
                clipboardManager.stopPolling();
                notificationManager.add("停止监听...");
            }
        }}
    >
        <ClipboardPenIcon />
    </button>
</main>
