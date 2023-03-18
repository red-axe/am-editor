---
toc: menu
---

# Collaborative editing configuration

This open-source library listens to changes in the `HTML` structure of the editing area (contenteditable root node), uses `MutationObserver` to reverse-engineer the data structure, and connects and interacts with [Yjs](https://github.com/yjs/yjs) through `WebSocket` to achieve multi-user collaborative editing.

## Installation

```bash
yarn add yjs @aomao/plugin-yjs @aomao/plugin-yjs-websocket
```

## Usage

### Client

```ts
import { withYjs, YjsEditor, YCursorEditor, CursorStateChangeEvent, CursorData } from '@aomao/plugin-yjs';
import { WebsocketProvider } from '@aomao/plugin-yjs-websocket';

// Initialize yjs doc
const doc = new Y.Doc()

// Initialize WebsocketProvider
const provider = new WebsocketProvider('server url', 'document id', doc, { connect: false })

const handleStatus = (event: Record<'status', 'connecting' | 'connected' | 'disconnected'>) => {
	if (!YjsEditor.isYjsEditor(engine)) return;
	// Handle relevant connection status
	const { status } = event;
	if(status === 'connected') {
		// Connected
		YjsEditor.connect(engine)
	} else if(status === 'disconnected') {
		// Disconnected
		YjsEditor.disconnect(engine)
	} else if(status === 'connecting') {
		// Connecting
	}
};
if (provider) provider.on('status', handleStatus);

// Get the share type of the yjs document. Here `content` represents the root node of the document, which needs to be consistent with the server. If you want to modify it, please keep it consistent between the client and server.
const sharedType = doc.get('content', Y.XmlElement) as Y.XmlElement;
// Use yjs plugin
// provider.awareness is the awareness plugin of yjs, used to synchronize cursors
withYjs(engine, sharedType, provider.awareness, {
	data: {
		name: 'Name of the current collaborative user',
		color: 'Color of the current collaborative user',
		avatar?: 'Optional, avatar of the current collaborative user',
		... // Other custom data
	},
});

```

Listen for cursor state changes of collaborators

```ts
// added: added collaborators, removed: removed collaborators, updated: updated collaborators
const handleCursorChange = ({ added, removed, updated }: CursorStateChangeEvent) => {
	if (added.length > 0) {
		for (const id of added) {
			// Get information of the collaborator
			const addedUser = YCursorEditor.cursorState(e, id);
			... // Custom handling of added collaborators
		}
	}
	if (removed.length > 0) {
		for (const id of removed) {
			... // Custom handling of removed collaborators
		}
	}
	// Cursor information of a collaborator will trigger this event when it is updated, and it is relatively frequent. If you only want to display the current information of all collaborative users, added and removed are enough
	if (updated.length > 0) {
		for (const id of updated) {
			... // Custom handling of updated collaborators
		}
	}
};
// Subscribe to cursor state changes
YCursorEditor.on(e, 'change', handleCursorChange);

```

### Server

`@aomao/plugin-yjs-websocket` also provides an implementation of `nodejs` server that can be used directly

```ts
yarn add yjs @aomao/plugin-yjs-websocket
```

Simply configure it and use it

```ts
import startServer from '@aomao/plugin-yjs-websocket/server';
// Start the server, the default port is 1234, and leveldb is used as the database
startServer();
```

Related configuration

```ts
startServer({
	// Host to listen on, default is 0.0.0.0
	host: string;
	// Port to listen on, default is 1234
	port: number;
	// Custom authentication, connection will be terminated if code !== 200 is returned
	auth?: (request: http.IncomingMessage, ws: WebSocket) => Promise<void | { code: number; data: string | Buffer }>;
	// Persistence options, false means no persistence
	/**
	* Default is leveldb
	* {
	*   provider: 'leveldb';
	*   dir?: string; // leveldb directory, default is ./db
	* }
	* mongodb configuration
	* {
	*   provider: 'mongodb';
	*   url
	* }
	*/
	persistenceOptions?: PersistenceOptions | false;
	// Document content field, default is "content"
	contentField?: string;
	// Update callback
	callback?: UpdateCallback;
	// Initial value
	initialValue?: Element;
})
```
