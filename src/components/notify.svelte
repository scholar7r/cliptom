<script lang="ts">
    import { fly, slide } from "svelte/transition";

    interface Props {
        message: string;
        createdAt: Date;
    }

    let { message, createdAt }: Props = $props();
</script>

<div
    class="card font-mono"
    in:fly={{ y: -20, duration: 300 }}
    out:slide={{ duration: 200 }}
>
    <div class="card bg-surface-50-950">
        <div class="flex flex-col gap-1 p-2">
            <div class="text-xs text-surface-600-400">
                [{createdAt.getHours().toString().padStart(2, "0")}:{createdAt
                    .getMinutes()
                    .toString()
                    .padStart(2, "0")}:{createdAt
                    .getSeconds()
                    .toString()
                    .padStart(2, "0")}]
            </div>
            <div class="text-xs text-surface-900-100">{message}</div>
        </div>
    </div>
</div>
