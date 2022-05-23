import React, {
	useEffect,
	useRef,
	useState,
	useImperativeHandle,
	useCallback,
	forwardRef,
	useContext,
} from 'react';
import message from 'antd/es/message';
import {
	EditorInterface,
	isEngine,
	RangeInterface,
	random,
	NodeInterface,
	isNode,
} from '@aomao/engine';
import Loading from '../loading';
import CommentButton from './button';
import { CommentContent, DataItem, DataSourceItem } from './types';
import { Member } from '../editor/ot/types';
import CommentItem from './item';
import context from '../../context';
import { useDispatch, useSelector } from '../../hooks';
import 'antd/es/message/style';
import './index.css';

export type CommentProps = {
	editor: EditorInterface;
	member: Member;
	onUpdate?: () => void;
} & { ref: React.Ref<CommentRef> };

export type CommentRef = {
	reload: () => void;
};

const Comment: React.FC<CommentProps> = forwardRef<CommentRef, CommentProps>(
	({ editor, member, ...props }, ref) => {
		const buttonRef = useRef<CommentButton>();
		const containerRef = useRef<HTMLDivElement | null>(null);
		const { lang } = useContext(context);
		const itemNodes = useRef<Array<HTMLDivElement>>([]);
		const [editItem, setEditItem] = useState<
			DataItem & { editId?: number }
		>();
		const [editValue, setEditValue] = useState<string>('');
		const [editing, setEditing] = useState<boolean>(false);
		const [list, setList] = useState<Array<DataItem>>([]);

		const dispatch = useDispatch();
		const load = useCallback(() => {
			dispatch({
				type: 'comment/fetch',
			});
		}, [dispatch]);

		const { dataSource } = useSelector((state) => state.comment);
		const loading = useSelector((state) => state.loading['comment/fetch']);
		useEffect(() => {
			if (loading) return;
			const tempList: Array<DataItem> = [];
			dataSource.forEach((item: DataSourceItem) => {
				//获取评论编号对应在编辑器中的所有节点
				const elements: Array<NodeInterface> =
					editor.command.executeMethod(
						'mark-range',
						'action', //插件名称
						'comment', //标记类型
						'find', //调用的方法
						item.id,
					);
				if (elements.length === 0) return;
				//获取目标评论在编辑器中的 top
				const top = getRectTop(elements[0]);
				if (top < 0) return;
				tempList.push({
					...item,
					top,
					type: list.find((c) => c.id === item.id)?.type || 'view',
				});
			});
			//根据top大小排序，越小排在越前面
			updateList(tempList.sort((a, b) => (a.top < b.top ? -1 : 1)));
		}, [loading, dataSource]);

		const remove = (render_id: string, id: number) => {
			dispatch<void>({
				type: 'comment/remove',
				payload: {
					render_id,
					id,
				},
			})?.then(() => {
				const data = [...list];
				const itemIndex = data.findIndex((i) => i.id === render_id);
				if (itemIndex > -1) {
					const item = data[itemIndex];
					const childIndex = item.children.findIndex(
						(c) => c.id === id,
					);
					if (childIndex > -1) item.children.splice(childIndex, 1);
					if (item.children.length === 0) {
						data.splice(itemIndex, 1);
						editor.command.executeMethod(
							'mark-range',
							'action',
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
					if (props.onUpdate) props.onUpdate();
				}
			});
		};
		/**
		 * 首次渲染后，加载评论列表
		 */
		useEffect(() => {
			buttonRef.current = new CommentButton(editor);
			load();
			//在编辑器每次设置完值后，重新加载评论列表
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
						(!list[index - 1] ||
							list[index - 1].top <= editItem.top),
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
				if (editItem) return;
				event.preventDefault();
				event.stopPropagation();
				if (isEngine(editor)) {
					const text = editor.command.executeMethod(
						'mark-range',
						'action',
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
		}, [showEdit, editItem]);

		/**
		 * 在 加载数据完毕 或者 列表数据 更新后，设置每个评论项位置
		 */
		useEffect(() => {
			const update = () => {
				setList((list) => {
					return list.concat().map((item) => {
						const top = getRectTop(
							`[data-comment-id="${item.id}"]`,
						);
						if (top < 0) return item;
						return { ...item, top };
					});
				});
			};
			if (typeof ResizeObserver === 'undefined') return;
			const resizeObserver = new ResizeObserver(update);
			const container = editor.container.get<HTMLElement>()!;
			resizeObserver.observe(container);
			return () => {
				resizeObserver.unobserve(container);
			};
		}, []);

		useEffect(() => {
			updateHeight();
			normalize();
		}, [loading, list]);

		/**
		 * 暴露函数
		 */
		useImperativeHandle(ref, () => ({
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
		const getRectTop = (
			selectors: string | NodeInterface | Node,
		): number => {
			//获取选择器节点
			let element =
				typeof selectors === 'string'
					? editor.container
							.get<HTMLElement>()!
							.querySelector(selectors)
					: isNode(selectors)
					? (selectors as Element)
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
					? item.children.find((c) => c.id === id)?.content || ''
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
			let index = data.findIndex((item) => item.type !== 'view');
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
				index = data.findIndex((item) => item.id === id);
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
				editor.command.executeMethod(
					'mark-range',
					'action',
					'comment',
					'revoke',
				);
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
			dispatch<void>({
				type: 'comment/updateStatus',
				payload: {
					ids: ids.join(','),
					status,
				},
			})?.then(() => {
				const data = [...list];
				data.forEach((item) => {
					if (ids.indexOf(item.id) > -1) {
						item.status = status;
						if (item.id === editItem?.id && status === false) {
							updateEditItem(undefined);
						}
					}
				});
				if (status) {
					if (load) load();
				}
				//重新设置列表
				else updateList(data);
			});
		};

		useEffect(() => {
			//标记数据更新后触发
			const markChange = (
				addIds: { [key: string]: Array<string> },
				removeIds: { [key: string]: Array<string> },
			) => {
				const commentAddIds = addIds['comment'] || [];
				const commentRemoveIds = removeIds['comment'] || [];

				//更新状态
				updateStatus(commentAddIds, true);
				updateStatus(commentRemoveIds, false);
			};
			editor.on('mark-range:change', markChange);
			//光标改变时触发
			const markSelect = (
				range: RangeInterface,
				selectInfo?: { key: string; id: string },
			) => {
				const { key, id } = selectInfo || {};
				buttonRef.current?.show(range);
				select(key === 'comment' ? id : undefined);
				if (key === 'comment' && id) {
					editor.command.executeMethod(
						'mark-range',
						'action',
						key,
						'preview',
						id,
					);
				}
			};
			editor.on('mark-range:select', markSelect);
			return () => {
				editor.off('mark-range:change', markChange);
				editor.off('mark-range:select', markSelect);
			};
		}, [editor, updateStatus, select]);

		/**
		 * 更新每个评论项的位置，默认以编辑器中的评论区域的top为目标。在评论项过多的情况下。以当前激活的可编辑项为基准，在其上方的向上偏移，在其下方的向下偏移
		 * @returns
		 */
		const normalize = () => {
			if (list.length === 0 || itemNodes.current.length === 0) return;
			let activeIndex = list.findIndex((item) => item.type !== 'view');
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
			(node) => {
				if (node !== null) {
					itemNodes.current.push(node);
				}
			},
			[list],
		);

		/**
		 * 渲染编辑区域
		 */
		const onItemOk = useCallback(
			(event: React.MouseEvent) => {
				//提交评论到服务端
				event.preventDefault();
				event.stopPropagation();
				//没有子评论编辑id就认定为增加评论，否则为修改评论内容
				if (!editValue || editing || !editItem) return;
				setEditing(true);
				let result:
					| Promise<boolean | { data: CommentContent }>
					| undefined = undefined;
				if (!editItem.editId) {
					result = dispatch<{ data: CommentContent }>({
						type: 'comment/add',
						payload: {
							title: editItem.title,
							render_id: editItem.id,
							content: editValue,
							username: member.name,
						},
					});
				} else {
					result = dispatch<boolean>({
						type: 'comment/update',
						payload: {
							id: editItem.editId,
							render_id: editItem.id,
							content: editValue,
						},
					});
				}
				result
					?.then((res) => {
						const dataList = [...list];
						const index = dataList.findIndex(
							(item) => item.id === editItem.id,
						);
						if (index > -1) {
							const item = dataList[index];
							let comment;
							//编辑，就更新评论内容
							if (editItem.editId) {
								comment = item.children.find(
									(c) => c.id === editItem.editId,
								);
								if (comment) comment.content = editValue;
							}
							//增加，就增加到子级评论列表
							else if (typeof res !== 'boolean') {
								comment = { ...res.data };
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
								editor.command.executeMethod(
									'mark-range',
									'action',
									'comment',
									'apply',
									item.id,
								);
								editor.command.executeMethod(
									'mark-range',
									'action',
									'comment',
									'preview',
									item.id,
								);
							}
							//更新列表，重新获取评论项ref
							updateList(dataList);
							//通知外部更新评论列表
							if (
								(item.children.length > 1 || editItem.editId) &&
								props.onUpdate
							)
								props.onUpdate();
						}

						//标志编辑状态为false
						setEditing(false);
					})
					.catch((error) => {
						message.error(error);
						//回调增加失败，将评论预览标识从编辑器中移除
						if (isEngine(editor))
							editor.command.executeMethod(
								'mark-range',
								'action',
								'comment',
								'revoke',
							);
						setEditing(false);
					});
			},
			[editItem, editValue, editing, list],
		);

		const itemMouseEnter = (id: string) => {
			if (isEngine(editor) && editItem?.id !== id) {
				editor.command.executeMethod(
					'mark-range',
					'action',
					'comment',
					'preview',
					id,
				);
			}
		};

		const itemMouseLeave = (id: string) => {
			if (isEngine(editor) && editItem?.id !== id) {
				editor.command.executeMethod(
					'mark-range',
					'action',
					'comment',
					'revoke',
					id,
				);
			}
		};

		const itemMouseDown = (event: React.MouseEvent, id: string) => {
			if (editItem?.id === id) {
				return;
			}
			select(id);
		};

		const renderList = () => {
			return (
				<div className="doc-comment-layer" ref={containerRef}>
					<div className="doc-comment-title">
						{lang === 'zh-CN' ? '评论' : 'Comments'}
					</div>
					{loading && <Loading />}
					{list.map((item) => (
						<CommentItem
							key={item.id}
							ref={itemRef}
							item={item}
							edit={editItem}
							onMouseEnter={() => itemMouseEnter(item.id)}
							onMouseLeave={() => itemMouseLeave(item.id)}
							onMouseDown={(event) => {
								itemMouseDown(event, item.id);
							}}
							onCancel={(event) => {
								event.preventDefault();
								event.stopPropagation();
								select();
							}}
							onEdit={(item, id) => {
								updateEditItem(item, id);
							}}
							onOk={(event: React.MouseEvent) => onItemOk(event)}
							onRemove={remove}
							onChange={(value) => setEditValue(value)}
							loading={editing}
						/>
					))}
				</div>
			);
		};

		return renderList();
	},
);

export default Comment;
