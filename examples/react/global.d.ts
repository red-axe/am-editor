import type { EngineInterfacem, Parser } from '@aomao/engine';

declare global {
	interface Window {
		engine?: EngineInterface;
		Parser?: typeof Parser;
	}
}
