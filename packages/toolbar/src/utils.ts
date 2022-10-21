import { EngineInterface } from '@aomao/engine';

export const autoGetHotkey = (
	engine: EngineInterface,
	name: string,
	itemKey?: string,
) => {
	const plugin = engine?.plugin.components[name];
	if (plugin && plugin.hotkey) {
		let key = plugin.hotkey();
		if (key) {
			if (Array.isArray(key)) {
				if (itemKey) {
					const index = key.findIndex(
						(k: any) => typeof k === 'object' && k.args === itemKey,
					);
					key = key[index > -1 ? index : 0];
				} else {
					key = key[0];
				}
			}
			if (typeof key === 'object') {
				key = key.key;
			}
			return key;
		}
	}
	return;
};
const supportFontFamilyCache: { [key: string]: boolean } = {};
/**
 * 是否支持字体
 * @param font 字体名称
 * @returns
 */
export const isSupportFontFamily = (font: string) => {
	return checkSupportFontFamily((check) => {
		return check(font);
	});
};
export const checkSupportFontFamily = <T>(
	callback: (fn: (font: string) => boolean) => T,
): T => {
	const body = document.body;

	const container = document.createElement('span');
	container.innerHTML = Array(10).join('wi');
	container.style.cssText = [
		'position:absolute',
		'width:auto',
		'font-size:128px',
		'left:-99999px',
	].join(' !important;');

	body.appendChild(container);
	const getWidth = (fontFamily: string) => {
		container.style.fontFamily = fontFamily;
		return container.clientWidth;
	};

	const monoWidth = getWidth('monospace');
	const serifWidth = getWidth('serif');
	const sansWidth = getWidth('sans-serif');

	const result = callback((font) => {
		if (typeof font !== 'string') {
			console.log('Font name is not legal !');
			return false;
		}
		if (supportFontFamilyCache[font] !== undefined)
			return supportFontFamilyCache[font];
		const reuslt =
			monoWidth !== getWidth(font + ',monospace') ||
			sansWidth !== getWidth(font + ',sans-serif') ||
			serifWidth !== getWidth(font + ',serif');
		supportFontFamilyCache[font] = reuslt;
		return reuslt;
	});

	body.removeChild(container);
	return result;
};
