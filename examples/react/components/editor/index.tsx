import React, {
	useEffect,
	useRef,
	useState,
	useCallback,
	useMemo,
	useLayoutEffect,
} from 'react';
import ReactDOM from 'react-dom';
import { Modal, ModalFuncProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import * as Y from 'yjs';
//引入编辑器引擎
import { $, EngineInterface, isHotkey, Path, isMobile } from '@aomao/engine';
import { WebsocketProvider } from '@aomao/plugin-yjs-websocket';
import {
	withYjs,
	YjsEditor,
	YCursorEditor,
	CursorStateChangeEvent,
	CursorData,
} from '@aomao/plugin-yjs';
import EngineComponent, { EngineProps } from '../engine';

import { Collaboration } from './collaborators';
//Demo相关
import { IS_DEV } from '../../config';
import Loading from '../loading';
import CommentLayer, { CommentRef } from '../comment';
import Toc from '../toc';
import { cards, pluginConfig, plugins } from './config';
import Toolbar, { ToolbarItemProps } from './toolbar';
import './index.less';

export type Content = {
	value: string;
	paths: Array<{ id: Array<string>; path: Array<Path> }>;
};

export type EditorProps = Omit<EngineProps, 'defaultValue'> & {
	defaultValue?: Content;
	onSave?: (content: Content) => void;
	onLoad?: (engine: EngineInterface) => void;
	yjs?:
		| {
				url: string;
				id: string;
		  }
		| false;
	member?: CursorData;
	comment?: boolean;
	toc?: boolean;
	toolbar?: ToolbarItemProps;
};

const EditorComponent: React.FC<EditorProps> = ({
	defaultValue,
	onLoad,
	yjs,
	member,
	...props
}) => {
	const engine = useRef<EngineInterface | null>(null);
	const comment = useRef<CommentRef | null>(null);
	const [loading, setLoading] = useState(true);
	const [connected, setConnected] = useState(false);
	const [members, setMembers] = useState<Record<number, CursorData>>([]);

	const doc = useMemo(() => new Y.Doc(), []);
	const provider = React.useMemo(() => {
		const provider =
			typeof window === 'undefined' || !yjs
				? null
				: new WebsocketProvider(yjs.url, yjs.id, doc, {
						connect: false,
				  });

		const handleStatus = (
			event: Record<
				'status',
				'connecting' | 'connected' | 'disconnected'
			>,
		) => {
			const { status } = event;
			if (status === 'connected') {
				setConnected(true);
			} else if (status === 'connecting') {
			} else if (status === 'disconnected') {
				setConnected(false);
			}
			setLoading(false);
		};
		if (provider) provider.on('status', handleStatus);
		return provider;
	}, [doc, yjs]);

	const saveTimeout = useRef<NodeJS.Timeout | null>(null);
	/**
	 * 保存到服务器
	 */
	const save = useCallback(
		(value: string) => {
			if (!engine.current || !props.onSave) return;
			console.log('save', new Date().getTime());
			const filterValue: Content = props.comment
				? engine.current.command.executeMethod(
						'mark-range',
						'action',
						'comment',
						'filter',
						value,
				  )
				: { value, paths: [] };
			props.onSave(filterValue);
		},
		[props.onSave],
	);
	/**
	 * 60秒内无更改自动保存
	 */
	const autoSave = useCallback(() => {
		if (saveTimeout.current) clearTimeout(saveTimeout.current);
		saveTimeout.current = setTimeout(() => {
			const value = engine.current?.model.toValue() || '';
			save(value);
		}, 60000);
	}, [save]);

	//用户主动保存
	const userSave = useCallback(() => {
		if (!engine.current) return;
		console.log(engine.current.getHtml());
		//获取异步的值，有些组件可能还在处理中，比如正在上传
		engine.current.model
			.toValueAsync(undefined, (pluginName, card) => {
				console.log(`${pluginName} 正在等待...`, card?.getValue());
			})
			.then((value) => {
				save(value);
			})
			.catch((data) => {
				console.log('终止保存：', data.name, data.card?.getValue());
			});
	}, [engine, save]);

	useEffect(() => {
		const unloadSave = () => {
			save(engine.current?.model.toValue() || '');
		};
		window.addEventListener('beforeunload', unloadSave);
		return () => {
			window.removeEventListener('beforeunload', unloadSave);
		};
	}, [save]);

	const engineProps: EngineProps = {
		...props,
		plugins: props.plugins || plugins,
		cards: props.cards || cards,
		config: {
			...props.config,
			...pluginConfig(props.lang ?? 'en-US'),
		},
		// 编辑器值改变事件
		onChange: useCallback(
			(trigger: 'remote' | 'local' | 'both') => {
				if (loading) return;
				//自动保存，非远程更改，触发保存
				if (trigger !== 'remote') autoSave();
				if (props.onChange) props.onChange(trigger);
				if (IS_DEV) {
					const value = engine.current?.model.toValue();
					// 获取编辑器的值
					console.log(`value ${trigger} update:`, value);
					// 获取当前所有at插件中的名单
					console.log(
						'mention:',
						engine.current?.command.executeMethod(
							'mention',
							'getList',
						),
					);
					// 获取model的html
					console.log('model-html:', engine.current?.model?.toHTML());
					// 获取model的value
					console.log(
						'model-value:',
						engine.current?.model?.toValue(),
					);
					// 获取model的text
					console.log('model-text:', engine.current?.model?.toText());
				}
			},
			[loading, autoSave, props.onChange],
		),
	};

	useLayoutEffect(() => {
		if (!engine.current) return;
		//卡片最大化时设置编辑页面样式
		const onMaximize = () => {
			$('.editor-toolbar').css('z-index', '9999').css('top', '56px');
		};
		const onMinimize = () => {
			$('.editor-toolbar').css('z-index', '').css('top', '');
		};
		engine.current.on('card:maximize', onMaximize);
		engine.current.on('card:minimize', onMinimize);

		//设置编辑器值，还原评论标记
		const value: string | null = defaultValue
			? defaultValue.paths.length > 0
				? engine.current.command.executeMethod(
						'mark-range',
						'action',
						'comment',
						'wrap',
						defaultValue.paths,
						defaultValue.value,
				  )
				: defaultValue.value
			: null;
		//连接到协作服务端，demo文档

		const handleCustomMessage = (message: Record<string, any>) => {
			const { action } = message;
			if (value && action === 'initValue') {
				console.log('initValue');
				engine.current?.setValue(value);
				engine.current?.history.clear();
			}
		};

		if (yjs && provider) {
			provider.connect();
			provider.on('customMessage', handleCustomMessage);
			const sharedType = doc.get('content', Y.XmlElement) as Y.XmlElement;
			withYjs(engine.current, sharedType, provider.awareness, {
				data: member,
			});
		} else if (value) {
			// 非协同编辑，设置编辑器值，异步渲染后回调
			engine.current.setValue(value, (count) => {
				console.log('setValue loaded:', count);
				if (onLoad) onLoad(engine.current!);
				return setLoading(false);
			});
		}

		return () => {
			engine.current?.off('card:maximize', onMaximize);
			engine.current?.off('card:minimize', onMinimize);
			provider?.off('customMessage', handleCustomMessage);
			provider?.disconnect();
			if (engine.current && YjsEditor.isYjsEditor(engine.current))
				YjsEditor.disconnect(engine.current);
		};
	}, [engine, doc, yjs, provider]);

	useEffect(() => {
		const editor = engine.current;
		if (!editor || !YjsEditor.isYjsEditor(editor)) return;
		if (connected) YjsEditor.connect(editor);
		return () => {
			YjsEditor.disconnect(editor);
		};
	}, [connected]);

	// 引擎事件绑定
	useEffect(() => {
		if (!engine.current || loading) return;
		const keydown = (event: KeyboardEvent) => {
			if (isHotkey('mod+s', event)) {
				event.preventDefault();
				userSave();
			}
		};
		// 手动保存
		document.addEventListener('keydown', keydown);
		return () => {
			document.removeEventListener('keydown', keydown);
		};
	}, [engine, userSave, loading]);

	useEffect(() => {
		const e = engine.current;
		if (!e) return;

		const handleCursorChange = ({
			added,
			removed,
		}: CursorStateChangeEvent) => {
			if (added.length > 0) {
				setMembers((members) => {
					for (const id of added) {
						const newMember = YCursorEditor.cursorState(e, id);
						if (newMember?.data) {
							members[id] = newMember.data;
						}
					}
					return { ...members };
				});
			}
			if (removed.length > 0) {
				setMembers((members) => {
					for (const id of removed) {
						delete members[id];
					}
					return { ...members };
				});
			}
		};

		YCursorEditor.on(e, 'change', handleCursorChange);

		return () => YCursorEditor.off(e, 'change', handleCursorChange);
	}, []);
	// 协同事件绑定
	// useEffect(() => {
	// 	if (!props.ot || !otClient.current || loading) return;
	// 	const { onMembersChange, onStatusChange, onError, onMessage } =
	// 		props.ot;
	// 	// 用户加入或退出改变
	// 	const membersChange = (members: Array<Member>) => {
	// 		if (onMembersChange) onMembersChange(members);
	// 		setMembers(members);
	// 	};
	// 	otClient.current.on('membersChange', membersChange);
	// 	// 状态改变，退出时，强制保存
	// 	const statusChange = (
	// 		from: keyof typeof STATUS,
	// 		to: keyof typeof STATUS,
	// 	) => {
	// 		if (onStatusChange) onStatusChange(from, to);
	// 		if (to === STATUS.exit) {
	// 			userSave();
	// 		}
	// 	};
	// 	otClient.current.on('statusChange', statusChange);
	// 	// 错误监听
	// 	const error = (error: ERROR) => {
	// 		if (onError) onError(error);
	// 	};
	// 	otClient.current.on('error', error);
	// 	// 消息监听
	// 	const message = (message: { type: string; body: any }) => {
	// 		if (onMessage) onMessage(message);
	// 		// 更新评论列表
	// 		if (
	// 			message.type === 'updateCommentList' &&
	// 			comment.current?.reload
	// 		) {
	// 			comment.current.reload();
	// 		}
	// 	};
	// 	otClient.current.on('message', message);
	// 	return () => {
	// 		otClient.current?.off('membersChange', membersChange);
	// 		otClient.current?.off('statusChange', statusChange);
	// 		otClient.current?.off('error', error);
	// 		otClient.current?.off('message', message);
	// 	};
	// }, [otClient, loading, props.ot, userSave]);

	//广播通知更新评论列表吧
	const onCommentRequestUpdate = () => {
		// otClient.current?.broadcast('updateCommentList');
	};

	// 点击编辑区域外的空白位置继续聚焦编辑器
	const wrapperMouseDown = (event: React.MouseEvent) => {
		const { target } = event;
		if (
			!target ||
			['TEXTAREA', 'INPUT'].indexOf((target as Node).nodeName) > -1
		)
			return;
		if (
			engine.current &&
			engine.current.isFocus() &&
			$(target).closest('.editor-content').length === 0
		) {
			event.preventDefault();
		}
	};
	// 编辑器区域单击在没有元素的位置，聚焦到编辑器
	const editorAreaClick = (event: React.MouseEvent) => {
		const { target } = event;
		if (!target) return;
		if (engine.current && $(target).hasClass('editor-content')) {
			event.preventDefault();
			if (!engine.current.isFocus()) engine.current.focus(false);
		}
	};

	useEffect(() => {
		const headerOTMembersElement = document.getElementById(
			'am-editor-ot-members',
		);
		if (!headerOTMembersElement || !yjs) {
			return;
		}
		ReactDOM.render(
			<Collaboration members={members} />,
			headerOTMembersElement,
		);
	}, [members, yjs]);

	return (
		<Loading loading={loading || (yjs && !connected)}>
			<>
				{engine.current && (
					<Toolbar engine={engine.current} items={props.toolbar} />
				)}
				<div className="editor-wrapper" onMouseDown={wrapperMouseDown}>
					<div className="editor-container">
						<div
							className="editor-content"
							onMouseDown={editorAreaClick}
						>
							{
								<EngineComponent
									ref={engine}
									{...engineProps}
									defaultValue=""
								/>
							}
						</div>
						{engine.current && !isMobile && props.comment && (
							<CommentLayer
								ref={comment}
								editor={engine.current}
								member={
									member ||
									({
										avatar: 'https://cdn-image.aomao.com/10016/avatar/2020/04/17/1587113793-da092550-5b12-477e-b229-631908d0ac2b.png',
										name: 'test',
										uuid: 'test',
									} as unknown as CursorData)
								}
								onUpdate={onCommentRequestUpdate}
								{...(props.comment === true
									? {}
									: props.comment)}
							/>
						)}
					</div>
					{engine.current && !isMobile && props.toc && (
						<Toc editor={engine.current} />
					)}
				</div>
			</>
		</Loading>
	);
};

export default EditorComponent;
