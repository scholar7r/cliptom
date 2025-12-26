import { invoke } from "@tauri-apps/api/core";

export interface ConverterConfig {
    label: string;
    prefix?: string;
    suffix?: string;
    listenType: string;
}

export class ConverterManager {
    private separators: string[];
    private converters: ConverterConfig[];

    constructor(separators: string[], converters: ConverterConfig[]) {
        this.separators = separators;
        this.converters = converters;
    }

    async convert(value: string, converter: ConverterConfig): Promise<string> {
        try {
            const result: string = await invoke("handle_convert", {
                value: value,
                separators: this.separators,
                prefix: converter.prefix || "",
                suffix: converter.suffix || "",
            });
            return result;
        } catch (error) {
            console.error("Conversion failed:", error);
            throw error;
        }
    }

    getConverters(): ConverterConfig[] {
        return this.converters;
    }

    getConverterByType(listenType: string): ConverterConfig | undefined {
        return this.converters.find((c) => c.listenType === listenType);
    }

    setSeparators(separators: string[]): void {
        this.separators = separators;
    }

    getSeparators(): string[] {
        return this.separators;
    }
}
