export interface HotkeyInterface {
	handleKeydown(e: KeyboardEvent): void;
	enable(): void;
	disable(): void;
	destroy(): void;
}
