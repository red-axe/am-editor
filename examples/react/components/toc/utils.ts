export const findReadingSection = (elements: Array<Element>, top: number) => {
	top = top || 0;
	if (!elements || elements.length === 0) return -1;
	let i = 0;
	let index = -1;
	const len = elements.length;
	for (; i < len; i++) {
		const element = elements[i];
		if (!element || !element.getBoundingClientRect) continue;
		const rect = element.getBoundingClientRect();
		if (rect.height === 0) continue;
		if (rect.top <= top + 1) {
			if (i === len - 1) {
				index = i;
			} else {
				const nexElement = elements[i + 1];
				if (!nexElement || !nexElement.getBoundingClientRect) continue;
				const nextRect = nexElement.getBoundingClientRect();
				if (nextRect.top > top + 1) {
					index = i;
					break;
				}
			}
		}
	}
	return index;
};
