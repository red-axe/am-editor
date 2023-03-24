import React, { useContext, forwardRef } from 'react';
import moment from 'moment';
import Space from 'antd/es/space';
import { DataItem } from './types';
import ItemEdit from './edit';
import Context from '../../context';
import 'antd/es/space/style/css';

export type CommentItemProps = Omit<
	React.AnchorHTMLAttributes<HTMLDivElement>,
	'onChange'
> & {
	item: DataItem;
	edit?: DataItem & { editId?: number };
	loading?: boolean;
	onChange?: (value: string) => void;
	onCancel: (event: React.MouseEvent) => void;
	onOk: (event: React.MouseEvent) => void;
	onEdit: (itme: DataItem, info_id: number) => void;
	onRemove: (id: string, info_id: number) => void;
};

const CommentItem = forwardRef<HTMLDivElement, CommentItemProps>(
	(
		{
			item,
			edit,
			onChange,
			onOk,
			onCancel,
			onEdit,
			onRemove,
			loading,
			...props
		},
		ref,
	) => {
		const { lang } = useContext(Context);
		return (
			<div
				ref={ref}
				key={item.id}
				className={`doc-comment-item ${
					item.type !== 'view' ? 'doc-comment-item-active' : ''
				}`}
				{...props}
			>
				<div className="doc-comment-item-header">
					<div className="doc-comment-item-title">{item.title}</div>
				</div>
				<div className="doc-comment-item-body">
					{item.children.map(
						({ id, content, username, createdAt }, index) => {
							const itemContent =
								item.id === edit?.id && id === edit.editId ? (
									<ItemEdit
										key={`edit-${id}`}
										defaultValue={content}
										onOk={onOk}
										onCancel={onCancel}
										onChange={onChange}
										loading={loading}
									/>
								) : (
									content
								);
							return (
								<Space
									key={index}
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
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												onEdit(item, id);
											}}
										>
											{lang === 'zh-CN' ? '编辑' : 'Edit'}
										</a>
										<a
											onClick={(event) => {
												event.preventDefault();
												event.stopPropagation();
												onRemove(item.id, id);
											}}
										>
											{lang === 'zh-CN'
												? '删除'
												: 'Remove'}
										</a>
									</Space>
									<div className="doc-comment-item-content">
										{itemContent}
									</div>
								</Space>
							);
						},
					)}
					{item.id === edit?.id && !edit.editId && (
						<ItemEdit
							key={`edit-${item.id}`}
							onOk={onOk}
							onCancel={onCancel}
							onChange={onChange}
							loading={loading}
						/>
					)}
				</div>
			</div>
		);
	},
);

export default CommentItem;
