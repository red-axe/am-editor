import React, { useEffect, useRef, useState, useCallback } from 'react';
import debounce from 'lodash-es/debounce';
//引入编辑器引擎
import { $, EngineInterface, isHotkey, Path, isMobile } from '@aomao/engine';
import EngineComponent, { EngineProps } from '../engine';
//协同客户端
import OTComponent, { OTClient, Member, STATUS, ERROR } from './ot';
//Demo相关
import Loading from '../loading';
import CommentLayer, { CommentRef, getConfig } from '../comment';
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
	const [value, setValue] = useState('');
	const comment = useRef<CommentRef | null>(null);
	const [loading, setLoading] = useState(true);
	const [members, setMembers] = useState<Array<Member>>([]);
	const [member, setMember] = useState<Member | null>(null);
	const scrollNode = useRef<HTMLDivElement | null>();

	/**
	 * 保存到服务器
	 */
	const save = useCallback(() => {
		if (!engine.current || !props.onSave) return;
		const filterValue: Content = props.comment
			? engine.current.command.execute(
					'mark-range',
					'comment',
					'filter',
					value,
			  )
			: { value, paths: [] };
		props.onSave(filterValue);
	}, [value]);
	/**
	 * 60秒内无更改自动保存
	 */
	const autoSave = debounce(save, 60000);

	const engineProps: EngineProps = {
		...props,
		plugins: props.plugins || plugins,
		cards: props.cards || cards,
		config: {
			...props.config,
			...pluginConfig,
			'mark-range': getConfig(engine, comment),
		},
		onChange: useCallback(
			(value: string, trigger: 'remote' | 'local' | 'both') => {
				if (loading) return;
				setValue(value);
				//自动保存，非远程更改，触发保存
				if (trigger !== 'remote') autoSave();
				if (props.onChange) props.onChange(value, trigger);
				console.log(`value ${trigger} update:`, value);
				console.log(
					'mention:',
					engine.current?.command.execute('mention', 'getList'),
				);
				//console.log('html:', engine.getHtml());
			},
			[loading, autoSave],
		),
	};

	//用户主动保存
	const userSave = useCallback(() => {
		if (!engine.current) return;
		//获取异步的值，有些组件可能还在处理中，比如正在上传
		engine.current.getValueAsync().then((value) => {
			setValue(value);
			save();
		});
	}, [engine, save]);

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
					? engine.current.command.execute(
							'mark-range',
							'comment',
							'wrap',
							defaultValue.paths,
							defaultValue.value,
					  )
					: defaultValue.value;
			//设置编辑器值，并异步渲染卡片
			engine.current.setValue(value, {
				enableAsync: true,
				triggerOT: false, //对于异步渲染后的卡片节点不提交到协同服务端，否则会冲突
				callback: () => {
					//卡片异步渲染完成后
					if (!props.ot) {
						if (onLoad) onLoad(engine.current!);
						return setLoading(false);
					}
					//实例化协作编辑客户端
					const ot = new OTClient(engine.current!);
					//连接到协作服务端，demo文档
					const { url, docId, onReady } = props.ot;
					ot.connect(url, docId);
					ot.on('ready', (member) => {
						if (onLoad) onLoad(engine.current!);
						if (onReady) onReady(member);
						setMember(member);
						setLoading(false);
					});
					otClient.current = ot;
				},
			});
			setValue(value);
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

	return (
		<Loading loading={loading}>
			<>
				{props.ot && <OTComponent members={members} />}
				{engine.current && (
					<Toolbar engine={engine.current} items={props.toolbar} />
				)}
				<div className="editor-wrapper">
					<div className="editor-container" ref={scrollNode}>
						<div className="editor-content">
							{
								<EngineComponent
									ref={engine}
									{...engineProps}
									scrollNode={() => scrollNode.current}
									defaultValue=""
								/>
							}
						</div>
						{engine.current &&
							!isMobile &&
							member &&
							props.comment && (
								<CommentLayer
									ref={comment}
									editor={engine.current}
									member={member}
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
