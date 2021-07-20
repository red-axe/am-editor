import React, { useEffect } from 'react';
import Context from './context';
import useDispatch from './hooks/use-dispatch';
import useSelector from './hooks/use-selector';
import Editor, { Content } from './components/editor';
import Loading from './components/loading';
import { IS_DEV, lang } from './config';
import { isServer } from '@aomao/engine';

const localMember =
	typeof localStorage === 'undefined' ? null : localStorage.getItem('member');

const getMember = () => {
	return !!localMember ? JSON.parse(localMember) : null;
};

const wsUrl =
	IS_DEV && !isServer
		? `ws://${window.location.hostname}:8080`
		: 'wss://collab.aomao.com';
const member = getMember();

export default () => {
	const dispatch = useDispatch();

	const doc = useSelector((state) => state.doc);
	const loading = useSelector((state) => state.loading['doc/get']);

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

	if (loading !== false) return <Loading />;

	return (
		<Context.Provider value={{ lang }}>
			<Editor
				lang={lang}
				placeholder="这里是编辑区域哦~"
				defaultValue={doc}
				comment={true}
				toc={true}
				ot={{
					url: `${wsUrl}${member ? '?uid=' + member.id : ''}`,
					docId: 'demo',
					onReady: (member) => {
						if (member)
							localStorage.setItem(
								'member',
								JSON.stringify(member),
							);
					},
				}}
				onSave={onSave}
			/>
		</Context.Provider>
	);
};
