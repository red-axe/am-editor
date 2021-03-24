export interface HotkeyInterface {
	trigger(e: KeyboardEvent): void;
	enable(): void;
	disable(): void;
	destroy(): void;
}
