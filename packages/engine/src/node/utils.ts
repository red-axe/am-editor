import { NodeInterface, Selector } from '../types';

export const isNodeEntry = (selector: Selector): selector is NodeInterface => {
	return !!selector && (selector as NodeInterface).get !== undefined;
};

export const isNodeList = (selector: Selector): selector is NodeList => {
	return !!selector && (selector as NodeList).entries !== undefined;
};

export const isNode = (selector: Selector): selector is Node => {
	return !!selector && (selector as Node).nodeType !== undefined;
};
