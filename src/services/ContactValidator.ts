export class ContactValidator {
    private separators: string[];

    constructor(separators: string[]) {
        this.separators = separators;
    }

    validate(contact: string): boolean {
        const trimmed = contact.trim();

        for (const separator of this.separators) {
            const separatorIndex = trimmed.indexOf(separator);
            if (separatorIndex === 11 && trimmed.length === 16) {
                if (this.validateDigits(trimmed)) {
                    return true;
                }
            }
        }

        return false;
    }

    private validateDigits(text: string): boolean {
        for (let i = 0; i < 11; i++) {
            if (text[i] < "0" || text[i] > "9") {
                return false;
            }
        }

        for (let i = 12; i < 16; i++) {
            if (text[i] < "0" || text[i] > "9") {
                return false;
            }
        }

        return true;
    }

    setSeparators(separators: string[]): void {
        this.separators = separators;
    }

    getSeparators(): string[] {
        return this.separators;
    }
}
