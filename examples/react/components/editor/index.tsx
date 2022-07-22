import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Modal, ModalFuncProps } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
//引入编辑器引擎
import { $, EngineInterface, isHotkey, Path, isMobile } from '@aomao/engine';
import EngineComponent, { EngineProps } from '../engine';
//协同客户端
import OTComponent, { OTClient, Member, STATUS, ERROR } from './ot';
//Demo相关
import Loading from '../loading';
import CommentLayer, { CommentRef } from '../comment';
import Toc from '../toc';
import { cards, pluginConfig, plugins } from './config';
import Toolbar, { ToolbarItemProps } from './toolbar';
import './index.less';
import ReactDOM from 'react-dom';
import { IS_DEV } from '../../config';

export type Content = {
	value: string;
	paths: Array<{ id: Array<string>; path: Array<Path> }>;
};

export type EditorProps = Omit<EngineProps, 'defaultValue'> & {
	defaultValue?: Content;
	onSave?: (content: Content) => void;
	onLoad?: (engine: EngineInterface) => void;
	ot?:
		| {
				url: string;
				docId: string;
				onReady?: (member: Member) => void;
				onMembersChange?: (members: Array<Member>) => void;
				onStatusChange?: (
					from: keyof typeof STATUS,
					to: keyof typeof STATUS,
				) => void;
				onError?: (error: ERROR) => void;
				onMessage?: (message: { type: string; body: any }) => void;
		  }
		| false;
	comment?: boolean;
	toc?: boolean;
	toolbar?: ToolbarItemProps;
};

const EditorComponent: React.FC<EditorProps> = ({
	defaultValue,
	onLoad,
	...props
}) => {
	const engine = useRef<EngineInterface | null>(null);
	const otClient = useRef<OTClient | null>(null);
	const comment = useRef<CommentRef | null>(null);
	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<Array<Member>>([]);
	const [member, setMember] = useState<Member | null>(null);
	const errorModal = useRef<{
		destroy: () => void;
		update: (
			configUpdate:
				| ModalFuncProps
				| ((prevConfig: ModalFuncProps) => ModalFuncProps),
		) => void;
	} | null>(null);
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
			const value = engine.current?.getValue() || '';
			save(value);
		}, 60000);
	}, [save]);

	//用户主动保存
	const userSave = useCallback(() => {
		if (!engine.current) return;
		console.log(engine.current.getHtml());
		//获取异步的值，有些组件可能还在处理中，比如正在上传
		engine.current
			.getValueAsync(false, (pluginName, card) => {
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
			save(engine.current?.getValue() || '');
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
			...pluginConfig(props.lang),
		},
		// 编辑器值改变事件
		onChange: useCallback(
			(trigger: 'remote' | 'local' | 'both') => {
				if (loading) return;
				//自动保存，非远程更改，触发保存
				if (trigger !== 'remote') autoSave();
				if (props.onChange) props.onChange(trigger);
				if (IS_DEV) {
					const value = engine.current?.getValue();
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
					// 获取编辑器的html
					console.log('html:', engine.current?.getHtml());
					// 获取编辑器的json
					console.log('json:', engine.current?.getJsonValue());
					// 获取编辑器的text
					console.log('text:', engine.current?.getText());
				}
			},
			[loading, autoSave, props.onChange],
		),
	};

	useEffect(() => {
		if (!engine.current) return;
		//卡片最大化时设置编辑页面样式
		engine.current.on('card:maximize', () => {
			$('.editor-toolbar').css('z-index', '9999').css('top', '56px');
		});
		engine.current.on('card:minimize', () => {
			$('.editor-toolbar').css('z-index', '').css('top', '');
		});

		//设置编辑器值，还原评论标记
		if (defaultValue) {
			const value =
				defaultValue.paths.length > 0
					? engine.current.command.executeMethod(
							'mark-range',
							'action',
							'comment',
							'wrap',
							defaultValue.paths,
							defaultValue.value,
					  )
					: defaultValue.value;

			//连接到协作服务端，demo文档
			if (props.ot) {
				//实例化协作编辑客户端
				const ot = new OTClient(engine.current);
				const { url, docId, onReady } = props.ot;
				// 连接协同服务端，如果服务端没有对应docId的文档，将使用 defaultValue 初始化
				ot.connect(url, docId, value);
				ot.on('ready', (member) => {
					if (onLoad) onLoad(engine.current!);
					if (onReady) onReady(member);
					setMember(member);
					setLoading(false);
					if (errorModal.current) errorModal.current.destroy();
					errorModal.current = null;
				});
				ot.on('error', ({ code, message }) => {
					const errorMessage = (
						<p>
							{message}
							<LoadingOutlined />
						</p>
					);
					if (errorModal.current) {
						errorModal.current.update({
							title: code,
							content: errorMessage,
						});
					} else {
						errorModal.current = Modal.error({
							title: code,
							keyboard: false,
							mask: false,
							centered: true,
							content: errorMessage,
							okButtonProps: {
								style: { display: 'none' },
							},
						});
					}
				});
				otClient.current = ot;
			} else {
				// 非协同编辑，设置编辑器值，异步渲染后回调
				engine.current.setValue(value, (count) => {
					console.log('setValue loaded:', count);
					if (onLoad) onLoad(engine.current!);
					return setLoading(false);
				});
			}
		}

		return () => {
			otClient.current?.exit();
			engine.current = null;
			otClient.current = null;
		};
	}, [engine]);

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
	// 协同事件绑定
	useEffect(() => {
		if (!props.ot || !otClient.current || loading) return;
		const { onMembersChange, onStatusChange, onError, onMessage } =
			props.ot;
		// 用户加入或退出改变
		const membersChange = (members: Array<Member>) => {
			if (onMembersChange) onMembersChange(members);
			setMembers(members);
		};
		otClient.current.on('membersChange', membersChange);
		// 状态改变，退出时，强制保存
		const statusChange = (
			from: keyof typeof STATUS,
			to: keyof typeof STATUS,
		) => {
			if (onStatusChange) onStatusChange(from, to);
			if (to === STATUS.exit) {
				userSave();
			}
		};
		otClient.current.on('statusChange', statusChange);
		// 错误监听
		const error = (error: ERROR) => {
			if (onError) onError(error);
		};
		otClient.current.on('error', error);
		// 消息监听
		const message = (message: { type: string; body: any }) => {
			if (onMessage) onMessage(message);
			// 更新评论列表
			if (
				message.type === 'updateCommentList' &&
				comment.current?.reload
			) {
				comment.current.reload();
			}
		};
		otClient.current.on('message', message);
		return () => {
			otClient.current?.off('membersChange', membersChange);
			otClient.current?.off('statusChange', statusChange);
			otClient.current?.off('error', error);
			otClient.current?.off('message', message);
		};
	}, [otClient, loading, props.ot, userSave]);

	//广播通知更新评论列表吧
	const onCommentRequestUpdate = () => {
		otClient.current?.broadcast('updateCommentList');
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
		if (!headerOTMembersElement || !props.ot) {
			return;
		}
		ReactDOM.render(
			<OTComponent members={members} />,
			headerOTMembersElement,
		);
	}, [members, props.ot]);

	return (
		<Loading loading={loading}>
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
									member || {
										avatar: 'https://cdn-image.aomao.com/10016/avatar/2020/04/17/1587113793-da092550-5b12-477e-b229-631908d0ac2b.png',
										name: 'test',
										uuid: 'test',
									}
								}
								onUpdate={onCommentRequestUpdate}
								{...props.comment}
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
