import React, { useEffect, useRef, useState, useCallback } from 'react';
import debounce from 'lodash-es/debounce';
import Avatar from 'antd/lib/avatar';
import Message from 'antd/lib/message';
import Space from 'antd/lib/space';
//引入编辑器引擎
import Engine, {
	EngineInterface,
	isHotkey,
	RangeInterface,
	Request,
	Path,
} from '@aomao/engine';
//工具栏
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
//协同客户端
import OTClient, { Member } from './ot-client';
//Deomo相关
import Loading from './loading';
import CommentLayer from './comment';
import {
	IS_DEV,
	DOMAIN,
	cards,
	plugins,
	ImageUploader,
	MarkRange,
} from './config';
import 'antd/lib/avatar/style';
import 'antd/lib/message/style';
import 'antd/lib/space/style';
import './engine.less';

const localMember =
	typeof localStorage === 'undefined' ? null : localStorage.getItem('member');

const EngineDemo = () => {
	const ref = useRef<HTMLDivElement | null>(null);
	const request = useRef(new Request());
	const content = useRef<{
		value: string;
		paths: Array<{ id: Array<string>; path: Array<Path> }>;
	}>({ value: '', paths: [] });
	const value = useRef<string>('');
	const comment = useRef<{
		reload: () => void;
		select: (id?: string) => void;
		showButton: (range: RangeInterface) => void;
		updateStatus: (ids: Array<string>, status: boolean) => void;
	}>();

	const otClient = useRef<OTClient>();
	const engineRef = useRef<EngineInterface>();

	const [loading, setLoading] = useState(true);
	const [editorLoading, setEditorLoading] = useState(true);
	const [members, setMembers] = useState([]);
	const [member, setMember] = useState<Member | null>(
		localMember ? JSON.parse(localMember) : null,
	);
	/**
	 * 加载编辑数据
	 */
	const load = useCallback(() => {
		request.current
			.ajax({
				url: `${DOMAIN}/doc/get`,
			})
			.then(({ code, data }: any) => {
				if (code === 200) {
					content.current = data;
				} else {
					Message.error('加载出错了');
				}
				setLoading(false);
			});
	}, []);

	useEffect(() => {
		load();
	}, []);
	/**
	 * 保存到服务器
	 */
	const save = useCallback(() => {
		if (!engineRef.current) return;
		const filterValue = engineRef.current.command.execute(
			MarkRange.pluginName,
			'comment',
			'filter',
			value.current,
		);
		content.current = filterValue;
		request.current
			.ajax({
				url: `${DOMAIN}/doc/content`,
				method: 'POST',
				data: {
					content: content.current,
				},
			})
			.then(res => {
				console.log(res);
			});
	}, [value, engineRef]);
	/**
	 * 60秒内无更改自动保存
	 */
	const onSave = useCallback(debounce(save, 60000), [save]);

	useEffect(() => {
		if (!ref.current || loading) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			plugins: plugins.concat(ToolbarPlugin),
			cards: cards.concat(ToolbarComponent),
			config: {
				[ImageUploader.pluginName]: {
					file: {
						action: `${DOMAIN}/upload/image`,
					},
					remote: {
						action: `${DOMAIN}/upload/image`,
					},
					isRemote: (src: string) => src.indexOf(DOMAIN) < 0,
				},
				[MarkRange.pluginName]: {
					//标记类型集合
					keys: ['comment'],
					//标记数据更新后触发
					onChange: (
						addIds: { [key: string]: Array<string> },
						removeIds: { [key: string]: Array<string> },
					) => {
						const commentAddIds = addIds['comment'] || [];
						const commentRemoveIds = removeIds['comment'] || [];

						//更新状态
						comment.current?.updateStatus(commentAddIds, true);
						comment.current?.updateStatus(commentRemoveIds, false);
					},
					//光标改变时触发
					onSelect: (
						range: RangeInterface,
						selectInfo?: { key: string; id: string },
					) => {
						const { key, id } = selectInfo || {};
						comment.current?.showButton(range);
						comment.current?.select(
							key === 'comment' ? id : undefined,
						);
						if (comment.current && key === 'comment') {
							if (id)
								engine.command.execute(
									MarkRange.pluginName,
									key,
									'preview',
									id,
								);
						}
					},
				},
			},
		});
		engine.messageSuccess = (msg: string) => {
			Message.success(msg);
		};
		engine.messageError = (error: string) => {
			Message.error(error);
		};
		//初始化本地协作，用作记录历史
		engine.ot.initLockMode();
		//用户主动保存
		const userSave = () => {
			if (!engine) return;
			//获取异步的值，有些组件可能还在处理中，比如正在上传
			engine.getValueAsync().then(editorValue => {
				value.current = editorValue;
				save();
			});
		};
		//手动保存
		engine.container.on('keydown', (event: KeyboardEvent) => {
			if (isHotkey('mod+s', event)) {
				event.preventDefault();
				userSave();
			}
		});
		//设置编辑器值
		const wrapValue = engine.command.execute(
			MarkRange.pluginName,
			'comment',
			'wrap',
			content.current.paths,
			content.current.value,
		);
		engine.setValue(wrapValue);
		//监听编辑器值改变事件
		engine.on('change', editorValue => {
			value.current = editorValue;
			//自动保存
			onSave();
			console.log('value', editorValue);
			//console.log('html:', engine.getHtml());
		});
		//获取当前保存的用户信息
		const memberData = localStorage.getItem('member');
		const currentMember = !!memberData ? JSON.parse(memberData) : null;
		//实例化协作编辑客户端
		const ot = new OTClient(engine);
		//连接到协作服务端，demo文档
		const ws = IS_DEV ? 'ws://127.0.0.1:8080' : 'wss://collab.aomao.com';
		ot.connect(
			`${ws}${currentMember ? '?uid=' + currentMember.id : ''}`,
			'demo',
		);
		ot.on('ready', member => {
			//保存当前会员信息
			if (member) localStorage.setItem('member', JSON.stringify(member));
			setMember(member);
		});
		//用户加入或退出改变
		ot.on('membersChange', members => {
			setMembers(members);
		});
		//状态改变，退出时，强制保存
		ot.on('statusChange', (_, to: string) => {
			if (to === 'exit') {
				userSave();
			}
		});
		ot.on('message', ({ type }) => {
			if (type === 'updateCommentList') comment.current?.reload();
		});

		otClient.current = ot;
		engineRef.current = engine;
		setEditorLoading(false);
		return () => {
			ot.exit();
			engine.destroy();
		};
	}, [loading]);

	if (loading) return <Loading />;
	//广播通知更新评论列表吧
	const onCommentRequestUpdate = () => {
		otClient.current?.broadcast('updateCommentList', {});
	};

	return (
		<>
			<div className="editor-ot-users">
				<Space className="editor-ot-users-content" size="small">
					<span style={{ color: '#888888' }}>
						当前在线<strong>{members.length}</strong>人
					</span>
					{members.map(member => {
						return (
							<Avatar
								key={member['id']}
								size={24}
								style={{ backgroundColor: member['color'] }}
							>
								{member['name']}
							</Avatar>
						);
					})}
				</Space>
			</div>
			{!editorLoading && (
				<Toolbar
					engine={engineRef.current}
					items={[
						['collapse'],
						['undo', 'redo', 'paintformat', 'removeformat'],
						['heading', 'fontsize'],
						[
							'bold',
							'italic',
							'strikethrough',
							'underline',
							'moremark',
						],
						['fontcolor', 'backcolor'],
						['alignment'],
						['unorderedlist', 'orderedlist', 'tasklist', 'indent'],
						['link', 'quote', 'hr'],
					]}
				/>
			)}
			<div className="editor-wrapper">
				<div className="editor-container">
					<div ref={ref} />
				</div>
				{!editorLoading && (
					<CommentLayer
						editor={engineRef.current}
						member={member}
						update={onCommentRequestUpdate}
						ref={comment}
					/>
				)}
			</div>
		</>
	);
};

export default EngineDemo;
