import React, {
	useEffect,
	useRef,
	useState,
	useImperativeHandle,
	useCallback,
	forwardRef,
} from 'react';
import moment from 'moment';
import Message from 'antd/lib/message';
import Input from 'antd/lib/input';
import Button from 'antd/lib/button';
import Space from 'antd/lib/space';
import {
	Request,
	EditorInterface,
	AjaxOptions,
	isEngine,
	RangeInterface,
	random,
	NodeInterface,
} from '@aomao/engine';
import { DOMAIN, lang } from '../config';
import Loading from '../loading';
import CommentButton from './button';
import { Member } from '../ot-client';
import 'antd/lib/message/style/css';
import 'antd/lib/input/style/css';
import 'antd/lib/button/style/css';
import 'antd/lib/space/style/css';
import './index.css';

export type Props = {
	editor: EditorInterface;
	member: Member;
	update: () => void;
};

type DataSourceItem = {
	id: string;
	title: string;
	status?: boolean;
	children: Array<CommentContent>;
};

type CommentContent = {
	id: number;
	username: string;
	content: string;
	createdAt: number;
};

type DataItem = DataSourceItem & { top: number; type: 'view' | 'edit' | 'add' };

const Comment: React.FC<Props> = ({ editor, member, ...props }, ref) => {
	const buttonRef = useRef<CommentButton>();
	const containerRef = useRef<HTMLDivElement | null>(null);
	const request = useRef(new Request());
	const itemNodes = useRef<Array<HTMLDivElement>>([]);
	const [editItem, setEditItem] = useState<DataItem & { editId?: number }>();
	const [editValue, setEditValue] = useState<string>('');
	const [editing, setEditing] = useState<boolean>(false);
	const [list, setList] = useState<Array<DataItem>>([]);
	const [loading, setLoading] = useState(true);

	const load = () => {
		request.current
			.ajax({
				url: `${DOMAIN}/comment/list`,
			})
			.then(
				({
					code,
					data,
				}: {
					code: number;
					data: Array<DataSourceItem>;
				}) => {
					if (code === 200) {
						const list: Array<DataItem> = [];
						data.forEach((item: DataSourceItem) => {
							//获取目标评论在编辑器中的 top
							const elements: Array<NodeInterface> = editor.command.execute(
								'mark-range',
								'comment',
								'find',
								item.id,
							);
							if (elements.length === 0) return;
							const top = getRectTop(elements[0]);
							if (top < 0) return;
							list.push({
								...item,
								top,
								type: 'view',
							});
						});
						//根据top大小排序，越小排在越前面
						updateList(
							list.sort((a, b) => (a.top < b.top ? -1 : 1)),
						);
					} else {
						Message.error('加载出错了');
					}
					//标志加载完毕
					setLoading(false);
				},
			);
	};

	const remove = (render_id: string, id: number) => {
		request.current
			.ajax({
				url: `${DOMAIN}/comment/remove`,
				method: 'POST',
				data: {
					render_id,
					id,
				},
			})
			.then(({ code }: { code: number; data: Array<DataSourceItem> }) => {
				if (code === 200) {
					const data = [...list];
					const itemIndex = data.findIndex(i => i.id === render_id);
					if (itemIndex > -1) {
						const item = data[itemIndex];
						const childIndex = item.children.findIndex(
							c => c.id === id,
						);
						if (childIndex > -1)
							item.children.splice(childIndex, 1);
						if (item.children.length === 0) {
							data.splice(itemIndex, 1);
							editor.command.execute(
								'mark-range',
								'comment',
								'remove',
								item.id,
							);
							updateEditItem(undefined);
						} else {
							updateEditItem(item);
						}
						updateList(data);
						//通知外部更新评论列表
						props.update();
					}
				} else {
					Message.error('删除出错了');
				}
			});
	};
	/**
	 * 首次渲染后，加载评论列表
	 */
	useEffect(() => {
		buttonRef.current = new CommentButton(editor);
		load();
		editor.on('afterSetValue', load);
		return () => {
			editor.off('afterSetValue', load);
		};
	}, []);

	/**
	 * 渲染编辑
	 * @param title 编辑器中的评论区域的文本
	 * @returns
	 */
	const showEdit = useCallback(
		(title: string) => {
			const data = [...list];
			//增加
			const editItem: DataItem = {
				id: random(18),
				title,
				top: getRectTop(`[data-comment-preview="true"]`),
				type: 'add',
				status: true,
				children: [],
			};

			const index = data.findIndex(
				(item: any, index) =>
					item.top >= editItem.top &&
					(!list[index - 1] || list[index - 1].top <= editItem.top),
			);
			if (index === -1) data.push(editItem);
			else data.splice(index, 0, editItem);
			updateEditItem(editItem);
			updateList(data);
		},
		[list],
	);

	useEffect(() => {
		const onMouseDown = (event: MouseEvent) => {
			event.stopPropagation();
			if (isEngine(editor)) {
				const text = editor.command.execute(
					'mark-range',
					'comment',
					'preview',
				);
				if (!!text) {
					showEdit(text);
				}
			}
		};
		buttonRef.current?.on('mousedown', onMouseDown);
		return () => buttonRef.current?.off('mousedown', onMouseDown);
	}, [showEdit]);

	/**
	 * 在 加载数据完毕 或者 列表数据 更新后，设置每个评论项位置
	 */
	useEffect(() => {
		if (loading) return;
		updateHeight();
		normalize();
	}, [loading, list]);

	/**
	 * 暴露函数
	 */
	useImperativeHandle(ref, () => ({
		select,
		showButton: (range: RangeInterface) => buttonRef.current?.show(range),
		updateStatus,
		reload: load,
	}));

	const updateHeight = () => {
		if (containerRef.current)
			containerRef.current.style.minHeight = `${editor.root.height()}px`;
	};
	/**
	 * 获取编辑器中评论所在位置的 top
	 * @param selectors css 选择器
	 * @returns
	 */
	const getRectTop = (selectors: string | NodeInterface): number => {
		//获取选择器节点
		let element =
			typeof selectors === 'string'
				? editor.container.get<HTMLElement>()!.querySelector(selectors)
				: selectors.get<HTMLElement>();
		if (!element) return -1;
		//选好计算每个标记评论项距离编辑器根节点的top
		let top = 0;
		while (element && !editor.root.equal(element)) {
			const rect = element.getBoundingClientRect();
			const parent: HTMLElement | null = element.parentElement;
			if (!parent) break;
			const parentRect = parent.getBoundingClientRect();
			top += rect.top - parentRect.top;
			element = parent;
		}
		return top;
	};
	/**
	 * 更新需要渲染的编辑项
	 * @param item 评论项
	 * @param id 子评论编号
	 */
	const updateEditItem = (item?: DataItem, id?: number) => {
		setEditValue(
			id && item
				? item.children.find(c => c.id === id)?.content || ''
				: '',
		);
		setEditItem(item ? { ...item, editId: id } : undefined);
	};
	/**
	 * 更新列表数据
	 * @param data
	 */
	const updateList = (data: Array<DataItem>) => {
		//清除每个列表项的 ref
		itemNodes.current = [];
		setList(data);
	};

	/**
	 * 选择一个评论设置为可编辑
	 * @param id 评论编号
	 * @returns
	 */
	const select = (id?: string) => {
		const data = [...list];
		//移除已经在编辑状态的
		let index = data.findIndex(item => item.type !== 'view');
		const item = data[index];
		if (!item && !id) return;
		if (item && item.id !== id) {
			//如果增加状态，没有子级，移除整个评论
			if (item.type === 'add') {
				if (item.children.length === 0) data.splice(index, 1);
				else item.type = 'view';
			}
			//编辑状态，设置为浏览状态
			else {
				item.type = 'view';
			}
		}
		//增加目标为编辑状态
		if (id) {
			index = data.findIndex(item => item.id === id);
			const item = data[index];
			//设置目标为编辑状态
			if (item) {
				item.type = 'add';
				updateEditItem(item);
			}
			//如果目标吧id不存在
			else {
				updateEditItem(undefined);
			}
		} else {
			updateEditItem(undefined);
		}
		if (isEngine(editor))
			editor.command.execute('mark-range', 'comment', 'revoke');
		//重新设置列表
		updateList(data);
	};
	/**
	 * 更新评论项状态
	 * @param ids 编号集合
	 * @param status 状态，true 显示、flase 隐藏
	 */
	const updateStatus = (ids: Array<string>, status: boolean) => {
		updateHeight();
		if (ids.length === 0) return;

		request.current
			.ajax({
				url: `${DOMAIN}/comment/updateStatus`,
				method: 'POST',
				data: {
					ids: ids.join(','),
					status,
				},
			})
			.then(({ code }: { code: number; data: Array<DataSourceItem> }) => {
				if (code === 200) {
					const data = [...list];
					data.forEach(item => {
						if (ids.indexOf(item.id) > -1) {
							item.status = status;
							if (item.id === editItem?.id && status === false) {
								updateEditItem(undefined);
							}
						}
					});
					if (status) load();
					//重新设置列表
					else updateList(data);
				} else {
					Message.error('更新状态出错了');
				}
			});
	};
	/**
	 * 更新每个评论项的位置，默认以编辑器中的评论区域的top为目标。在评论项过多的情况下。以当前激活的可编辑项为基准，在其上方的向上偏移，在其下方的向下偏移
	 * @returns
	 */
	const normalize = () => {
		if (list.length === 0) return;
		let activeIndex = list.findIndex(item => item.type !== 'view');
		if (activeIndex < 0) activeIndex = 0;

		const activeItem = list[activeIndex];
		const element: HTMLDivElement = itemNodes.current[activeIndex];
		element.style.top = `${activeItem.top}px`;
		element.style.display = activeItem.status ? 'block' : 'none';
		let nextTop = activeItem.top;
		for (let i = activeIndex - 1; i >= 0; i--) {
			//获取当前评论循环项的dom节点
			const curElement: HTMLDivElement = itemNodes.current[i];
			//获取位置
			const curRect = curElement.getBoundingClientRect();
			//如果其下方的评论项的 top 超过了 当前项在编辑器中评论区域的top，就用其下方的评论项 top - 当前高度 - 预留 16px 空隙
			const nextSourceTop =
				list[i + 1].top === nextTop ? list[i + 1].top : nextTop;
			const top =
				nextSourceTop - 16 < list[i].top + curRect.height
					? nextTop - curRect.height - 16
					: list[i].top;
			nextTop = top;
			curElement.style.top = `${top}px`;
			curElement.style.display = list[i].status ? 'block' : 'none';
		}
		let prevTop = activeItem.top;
		for (let i = activeIndex + 1; i < list.length; i++) {
			//获取当前评论循环项的dom节点
			const curElement: HTMLDivElement = itemNodes.current[i];
			//获取位置
			//const curRect = curElement.getBoundingClientRect()
			//如果其上方的评论项的 top + 其上方评论项的高度 大于 当前项在编辑器中评论区域的top，就用其上方的评论项 + 其上方评论项的高度 + 16 预留 16px 空隙
			const prevElement: HTMLDivElement = itemNodes.current[i - 1];
			const prevRect = prevElement.getBoundingClientRect();

			const prevSourceTop =
				list[i - 1].top === prevTop ? list[i - 1].top : prevTop;

			const top =
				prevSourceTop + prevRect.height + 16 > list[i].top
					? prevTop + prevRect.height + 16
					: list[i].top;
			prevTop = top;
			curElement.style.top = `${top}px`;
			curElement.style.display = list[i].status ? 'block' : 'none';
		}
	};
	/**
	 * 设置评论项ref用于获取其dom节点
	 */
	const itemRef = useCallback(
		node => {
			if (node !== null) {
				itemNodes.current.push(node);
			}
		},
		[list],
	);

	/**
	 * 渲染编辑区域
	 */
	const renderEdit = useCallback(() => {
		//提交评论到服务端
		const post = (event: React.MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			if (!editValue || editing || !editItem) return;
			setEditing(true);
			//没有子评论编辑id就认定为增加评论，否则为修改评论内容
			const options: AjaxOptions = !editItem.editId
				? {
						url: `${DOMAIN}/comment/add`,
						method: 'POST',
						data: {
							title: editItem.title,
							render_id: editItem.id,
							content: editValue,
							username: member.name,
						},
				  }
				: {
						url: `${DOMAIN}/comment/update`,
						method: 'POST',
						data: {
							render_id: editItem.id,
							id: editItem.editId,
							content: editValue,
						},
				  };
			request.current
				.ajax(options)
				.then(
					({
						code,
						data,
						message,
					}: {
						code: number;
						data: CommentContent;
						message: string;
					}) => {
						const dataList = [...list];
						const index = dataList.findIndex(
							item => item.id === editItem.id,
						);
						if (code === 200) {
							if (index > -1) {
								const item = dataList[index];
								let comment;
								//编辑，就更新评论内容
								if (editItem.editId) {
									comment = item.children.find(
										c => c.id === editItem.editId,
									);
									if (comment) comment.content = editValue;
								}
								//增加，就增加到子级评论列表
								else {
									comment = { ...data };
									item.children.push(comment);
								}
								//最后在当前评论id内渲染为可继续添加评论
								item.type = 'add';
								updateEditItem(item);
								//第一次增加成功，将评论标识应用到编辑器中
								if (
									!editItem.editId &&
									item.children.length === 1
								) {
									editor.command.execute(
										'mark-range',
										'comment',
										'apply',
										item.id,
									);
									editor.command.execute(
										'mark-range',
										'comment',
										'preview',
										item.id,
									);
								}
								//更新列表，重新获取评论项ref
								updateList(dataList);
								//通知外部更新评论列表
								if (item.children.length > 1 || editItem.editId)
									props.update();
							}
						} else {
							Message.error(message);
							//回调增加失败，将评论预览标识从编辑器中移除
							if (isEngine(editor))
								editor.command.execute(
									'mark-range',
									'comment',
									'revoke',
								);
						}
						//标志编辑状态为false
						setEditing(false);
					},
				);
		};
		return (
			<div key={editItem?.id} className="doc-comment-edit-wrapper">
				<div className="doc-comment-edit-input">
					<Input
						value={editValue}
						onChange={e => setEditValue(e.target.value)}
					/>
				</div>
				<div className="doc-comment-edit-button">
					<Button
						size="small"
						onClick={(event: React.MouseEvent) => {
							event.preventDefault();
							event.stopPropagation();
							select();
						}}
					>
						{lang === 'zh-cn' ? '取消' : 'Cancel'}
					</Button>
					<Button
						size="small"
						type="primary"
						onClick={(event: React.MouseEvent) => post(event)}
						loading={editing}
					>
						{lang === 'zh-cn' ? '确定' : 'Ok'}
					</Button>
				</div>
			</div>
		);
	}, [editItem, editValue, editing, list]);

	const itemMouseEnter = (id: string) => {
		if (isEngine(editor) && editItem?.id !== id) {
			editor.command.execute('mark-range', 'comment', 'preview', id);
		}
	};

	const itemMouseLeave = (id: string) => {
		if (isEngine(editor) && editItem?.id !== id) {
			editor.command.execute('mark-range', 'comment', 'revoke', id);
		}
	};

	const itemMouseDown = (event: React.MouseEvent, id: string) => {
		if (editItem?.id === id) {
			return;
		}
		select(id);
	};
	/**
	 * 渲染每个评论项
	 * @param item
	 * @returns
	 */
	const renderItem = (item: DataItem) => {
		return (
			<div
				key={item.id}
				className={`doc-comment-item ${
					item.type !== 'view' ? 'doc-comment-item-active' : ''
				}`}
				ref={itemRef}
				onMouseEnter={() => itemMouseEnter(item.id)}
				onMouseLeave={() => itemMouseLeave(item.id)}
				onMouseDown={event => {
					itemMouseDown(event, item.id);
				}}
			>
				<div className="doc-comment-item-haeder">
					<div className="doc-comment-item-title">{item.title}</div>
				</div>
				<div className="doc-comment-item-body">
					{item.children.map(
						({ id, content, username, createdAt }) => {
							const itemContent =
								item.id === editItem?.id &&
								id === editItem.editId
									? renderEdit()
									: content;
							return (
								<Space
									key={id}
									className="doc-comment-item-row"
									direction="vertical"
								>
									<Space
										className="doc-comment-item-author"
										size="small"
									>
										{username}
										<span className="doc-comment-item-time">
											{moment()
												.startOf('seconds')
												.from(new Date(createdAt))}
										</span>
										<a
											onClick={event => {
												event.preventDefault();
												event.stopPropagation();
												updateEditItem(item, id);
											}}
										>
											编辑
										</a>
										<a
											onClick={event => {
												event.preventDefault();
												event.stopPropagation();
												remove(item.id, id);
											}}
										>
											删除
										</a>
									</Space>
									<div className="doc-comment-item-content">
										{itemContent}
									</div>
								</Space>
							);
						},
					)}
					{item.id === editItem?.id &&
						!editItem.editId &&
						renderEdit()}
				</div>
			</div>
		);
	};

	const renderList = () => {
		return (
			<div className="doc-comment-layer" ref={containerRef}>
				<div className="doc-comment-title">
					{lang === 'zh-cn' ? '评论' : 'Comment'}
				</div>
				{list.map(item => renderItem(item))}
			</div>
		);
	};

	return loading ? <Loading /> : renderList();
};

export default forwardRef(Comment);
