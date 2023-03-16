import * as Y from 'yjs';
import { EngineInterface } from '@aomao/engine';
import { Awareness } from '@aomao/plugin-yjs-protocols/awareness';
import { WithCursorsOptions, withYCursors } from './cursors';
import { withYjs as withYjsPlguin, WithYjsOptions, YjsEditor } from './yjs';

export type WithYjsPluginOptions = WithYjsOptions & WithCursorsOptions;

export const withYjs = (
	editor: EngineInterface,
	sharedRoot: Y.XmlElement,
	awareness: Awareness,
	options: WithYjsPluginOptions,
) => {
	const e = withYjsPlguin(editor, sharedRoot, options);
	return withYCursors(e, awareness, options);
};

export { YjsEditor };
