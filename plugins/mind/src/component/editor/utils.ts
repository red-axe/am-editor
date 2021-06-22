/**
 * depth first traverse, from root to leaves, children in inverse order
 *  if the fn returns false, terminate the traverse
 */
const traverse = <T extends { children?: T[] }>(
	data: T,
	fn: (param: T) => boolean,
) => {
	if (fn(data) === false) {
		return false;
	}

	if (data && data.children) {
		for (let i = data.children.length - 1; i >= 0; i--) {
			if (!traverse(data.children[i], fn)) return false;
		}
	}
	return true;
};

/**
 * depth first traverse, from root to leaves, children in inverse order
 *  if the fn returns false, terminate the traverse
 */
export const traverseTree = <T extends { children?: T[] }>(
	data: T,
	fn: (param: T) => boolean,
) => {
	if (typeof fn !== 'function') {
		return;
	}
	traverse(data, fn);
};
