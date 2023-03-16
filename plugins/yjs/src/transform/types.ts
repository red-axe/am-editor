import type Y from 'yjs';
import type { Element, Node } from '@aomao/engine';
export type DeltaInsert = {
	insert:
		| string
		| Y.XmlText
		| Y.XmlElement
		| (string | Y.XmlText | Y.XmlElement)[];
	attributes?: Record<string, unknown>;
};

export type InsertDelta = Array<DeltaInsert>;

export type RelativeRange = {
	anchor: Y.RelativePosition;
	focus: Y.RelativePosition;
};

export type TextRange = { start: number; end: number };

export type YTarget = {
	// Y.XmlText containing the editor node
	yParent: Y.XmlElement;

	yOffset: number;

	// Editor element mapping to the yParent
	editorParent: Element;

	// If the target points to a editor element, Y.XmlText representing the target.
	// If it points to a text (or position to insert), this will be undefined.
	yTarget?: Y.XmlText | Y.XmlElement;

	// Editor node represented by the textRange, won't be set if position is insert.
	editorTarget?: Node;
};
