import React, { useEffect, useRef, useState, useCallback } from 'react';
import debounce from 'lodash-es/debounce';
import Avatar from 'antd/es/avatar';
import Message from 'antd/es/message';
import Space from 'antd/es/space';
import Modal from 'antd/es/modal';
//引入编辑器引擎
import Engine, {
	$,
	EngineInterface,
	isHotkey,
	RangeInterface,
	Request,
	Path,
	isMobile,
} from '@aomao/engine';
//工具栏
import Toolbar, { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar';
//协同客户端
import OTClient, { Member } from './ot-client';
//Demo相关
import Loading from './loading';
import CommentLayer from './comment';
import Toc from './toc';
import {
	IS_DEV,
	DOMAIN,
	cards,
	plugins,
	ImageUploader,
	FileUploader,
	VideoUploader,
	MarkRange,
	Math,
	lang,
} from './config';
import 'antd/es/avatar/style';
import 'antd/es/message/style';
import 'antd/es/space/style';
import 'antd/es/modal/style';
import './engine.less';

const localMember =
	typeof localStorage === 'undefined' ? null : localStorage.getItem('member');

const getMember = () => {
	return !!localMember ? JSON.parse(localMember) : null;
};

const EngineDemo = () => {
	const ref = useRef<HTMLDivElement | null>(null);
	const request = useRef(new Request());
	const content = useRef<{
		value: string;
		paths: Array<{ id: Array<string>; path: Array<Path> }>;
	}>({ value: '', paths: [] });
	const value = useRef<string>('');
	const comment = useRef<
		| (HTMLDivElement & {
				reload: () => void;
				select: (id?: string) => void;
				showButton: (range: RangeInterface) => void;
				updateStatus: (ids: Array<string>, status: boolean) => void;
		  })
		| null
	>();

	const otClient = useRef<OTClient>();
	const engineRef = useRef<EngineInterface>();

	const [loading, setLoading] = useState(true);
	const [editorLoading, setEditorLoading] = useState(true);
	const [members, setMembers] = useState([]);
	const [member, setMember] = useState<Member | null>(getMember());

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
			.then((res) => {
				console.log(res);
			});
	}, [value, engineRef]);
	/**
	 * 60秒内无更改自动保存
	 */
	const onSave = useCallback(debounce(save, 60000), [save]);

	//用户主动保存
	const userSave = () => {
		if (!engineRef.current) return;
		//获取异步的值，有些组件可能还在处理中，比如正在上传
		engineRef.current.getValueAsync().then((editorValue) => {
			value.current = editorValue;
			save();
		});
	};

	useEffect(() => {
		if (!ref.current || loading) return;
		//实例化引擎
		const engine = new Engine(ref.current, {
			lang,
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
				[FileUploader.pluginName]: {
					action: `${DOMAIN}/upload/file`,
				},
				[VideoUploader.pluginName]: {
					action: `${DOMAIN}/upload/video`,
				},
				[Math.pluginName]: {
					action: `https://g.aomao.com/latex`,
					parse: (res: any) => {
						if (res.success) return { result: true, data: res.svg };
						return { result: false };
					},
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
		engine.messageConfirm = (msg: string) => {
			return new Promise<boolean>((resolve, reject) => {
				Modal.confirm({
					content: msg,
					onOk: () => resolve(true),
					onCancel: () => reject(),
				});
			});
		};
		//初始化本地协作，用作记录历史
		engine.ot.initLockMode();

		//手动保存
		engine.container.on('keydown', (event: KeyboardEvent) => {
			if (isHotkey('mod+s', event)) {
				event.preventDefault();
				userSave();
			}
		});
		//监听编辑器值改变事件
		engine.on('change', (editorValue) => {
			value.current = editorValue;
			//自动保存
			onSave();
			console.log('value', editorValue);
			//console.log('html:', engine.getHtml());
		});
		//卡片最大化时设置编辑页面样式
		engine.on('card:maximize', () => {
			$('.editor-toolbar').css('z-index', '9999').css('top', '56px');
		});
		engine.on('card:minimize', () => {
			$('.editor-toolbar').css('z-index', '').css('top', '');
		});

		engineRef.current = engine;
		setEditorLoading(false);
		return () => {
			engine.destroy();
		};
	}, [loading]);

	useEffect(() => {
		if (editorLoading || !engineRef.current) return;
		//设置编辑器值
		const wrapValue = engineRef.current.command.execute(
			MarkRange.pluginName,
			'comment',
			'wrap',
			content.current.paths,
			content.current.value,
		);
		engineRef.current.setValue(wrapValue);
		//实例化协作编辑客户端
		const ot = new OTClient(engineRef.current);
		//连接到协作服务端，demo文档
		const ws = IS_DEV
			? `ws://${window.location.hostname}:8080`
			: 'wss://collab.aomao.com';
		const member = getMember();
		ot.connect(`${ws}${member ? '?uid=' + member.id : ''}`, 'demo');
		ot.on('ready', (member) => {
			//保存当前会员信息
			if (member) localStorage.setItem('member', JSON.stringify(member));
			setMember(member);
		});
		//用户加入或退出改变
		ot.on('membersChange', (members) => {
			setMembers(members);
		});
		//状态改变，退出时，强制保存
		ot.on('statusChange', (_, to: string) => {
			if (to === 'exit') {
				userSave();
			}
		});
		//错误连接清除当前存储的本地会员信息，以便重新获取新的编号，真实环境下不需要这么做
		ot.on('error', () => {
			if (member) {
				localStorage.setItem('member', '');
				setMember(null);
			}
		});
		ot.on('message', ({ type }) => {
			if (type === 'updateCommentList') comment.current?.reload();
		});

		otClient.current = ot;
		return () => {
			ot.exit();
		};
	}, [editorLoading]);

	if (loading) return <Loading />;

	//广播通知更新评论列表吧
	const onCommentRequestUpdate = () => {
		otClient.current?.broadcast('updateCommentList', {});
	};

	return (
		<>
			<div className="editor-ot-users">
				<Space className="editor-ot-users-content" size="small">
					{!isMobile && (
						<span style={{ color: '#888888' }}>
							{lang === 'zh-cn' ? (
								<>
									当前在线<strong>{members.length}</strong>人
								</>
							) : (
								<>
									<strong>{members.length}</strong> person
									online
								</>
							)}
						</span>
					)}
					{members.map((member) => {
						return (
							<Avatar
								key={member['id']}
								size={isMobile ? 18 : 24}
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
					engine={engineRef.current!}
					items={
						isMobile
							? [
									['undo', 'redo'],
									{
										icon: 'text',
										items: [
											'bold',
											'italic',
											'strikethrough',
											'underline',
											'moremark',
										],
									},
									[
										{
											type: 'button',
											name: 'image-uploader',
											icon: 'image',
										},
										'link',
										'tasklist',
										'heading',
									],
									{
										icon: 'more',
										items: [
											{
												type: 'button',
												name: 'video-uploader',
												icon: 'video',
											},
											{
												type: 'button',
												name: 'file-uploader',
												icon: 'attachment',
											},
											{
												type: 'button',
												name: 'table',
												icon: 'table',
											},
											{
												type: 'button',
												name: 'math',
												icon: 'math',
											},
											{
												type: 'button',
												name: 'codeblock',
												icon: 'codeblock',
											},
											{
												type: 'button',
												name: 'orderedlist',
												icon: 'orderedlist',
											},
											{
												type: 'button',
												name: 'unorderedlist',
												icon: 'unorderedlist',
											},
											{
												type: 'button',
												name: 'hr',
												icon: 'hr',
											},
										],
									},
							  ]
							: [
									['collapse'],
									[
										'undo',
										'redo',
										'paintformat',
										'removeformat',
									],
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
									[
										'unorderedlist',
										'orderedlist',
										'tasklist',
										'indent',
									],
									['link', 'quote', 'hr'],
							  ]
					}
				/>
			)}
			<div className="editor-wrapper">
				<div className="editor-container">
					<div className="editor-content">
						<div ref={ref} />
					</div>
					{!editorLoading && !isMobile && (
						<CommentLayer
							editor={engineRef.current!}
							member={member!}
							update={onCommentRequestUpdate}
							ref={comment}
						/>
					)}
				</div>
				{!editorLoading && !isMobile && (
					<Toc editor={engineRef.current!} />
				)}
			</div>
		</>
	);
};

export default EngineDemo;
