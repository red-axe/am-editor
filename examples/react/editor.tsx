import { useEffect, useState, useCallback } from 'react';
import { isServer, EngineInterface } from '@aomao/engine';
import { CursorData } from '@aomao/plugin-yjs';
import { faker } from '@faker-js/faker';
import Context from './context';
import useDispatch from './hooks/use-dispatch';
import useSelector from './hooks/use-selector';
import Editor, { Content } from './components/editor';
import Loading from './components/loading';
import { IS_DEV, lang } from './config';
import Space from 'antd/es/space';
import Button from 'antd/es/button';
import 'antd/es/space/style/css';
import 'antd/es/button/style/css';
import './editor.less';
import React from 'react';

const localMember =
	typeof localStorage === 'undefined' ? null : localStorage.getItem('member');

const getMember = (): CursorData => {
	if (localMember === null) {
		const { name } = faker;
		const member = {
			name: `${name.firstName()} ${name.lastName()}`,
			avatar: faker.image.avatar(),
			color: faker.color.rgb(),
		};
		localStorage.setItem('member', JSON.stringify(member));
		return member;
	}
	return JSON.parse(localMember);
};

const wsUrl =
	IS_DEV && !isServer
		? `ws://${window.location.hostname}:1234`
		: 'wss://collab.aomao.com';
const member = getMember();

const getReadonlyValue =
	typeof localStorage === 'undefined'
		? null
		: localStorage.getItem('engine-readonly');

const isReadonly =
	getReadonlyValue === null ? false : getReadonlyValue === 'true';

const setReadonlyValue = (readonly: boolean) => {
	localStorage.setItem('engine-readonly', readonly ? 'true' : 'false');
};

const yjsConfig = {
	url: wsUrl,
	id: 'demo',
};
export default () => {
	const dispatch = useDispatch();
	const [engine, setEngine] = useState<EngineInterface | null>(null);
	const doc = useSelector((state) => state.doc);
	const loading = useSelector((state) => state.loading['doc/get']);
	const [readonly, setReadonly] = useState(isReadonly);

	useEffect(() => {
		if (!!doc.value) return;

		dispatch({
			type: 'doc/get',
		});
	}, [doc]);

	const onSave = (content: Content) => {
		dispatch({
			type: 'doc/save',
			payload: content,
		});
	};

	const updateReadonly = useCallback(
		(readonly: boolean) => {
			setReadonlyValue(readonly);
			if (engine) engine.readonly = readonly;
			setReadonly(readonly);
		},
		[engine],
	);

	if (loading !== false) return <Loading />;

	return (
		<Context.Provider value={{ lang }}>
			{/* <Space className="doc-editor-mode">
				<Button
					size="small"
					disabled={readonly}
					type="primary"
					onClick={() => updateReadonly(true)}
				>
					{lang === 'zh-CN' ? '只读模式' : 'Readonly mode'}
				</Button>
				<Button
					size="small"
					disabled={!readonly}
					type="primary"
					onClick={() => updateReadonly(false)}
				>
					{lang === 'zh-CN' ? '编辑模式' : 'Edit mode'}
				</Button>
			</Space> */}
			<Editor
				lang={lang}
				placeholder="这里是编辑区域哦~"
				defaultValue={doc}
				comment={true}
				readonly={isReadonly}
				onLoad={setEngine}
				toc={true}
				member={member}
				yjs={IS_DEV ? false : yjsConfig}
				onSave={onSave}
			/>
		</Context.Provider>
	);
};
