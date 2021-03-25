import React from 'react';
import classnames from 'classnames';
import { Tooltip } from 'antd';
import 'antd/lib/tooltip/style';

export type LinkPreviewProps = {
	href?: string;
	className?: string;
	onEdit: (event: React.MouseEvent) => void;
	onRemove: (event: React.MouseEvent) => void;
};

const LinkPreview: React.FC<LinkPreviewProps> = ({
	href,
	onEdit,
	onRemove,
}) => {
	return (
		<div className={classnames('data-link-preview')}>
			<Tooltip title="打开链接">
				<a
					className="data-icon data-icon-link data-link-preview-open"
					href={href}
					target="_blank"
				>
					{href}
				</a>
			</Tooltip>
			<Tooltip title="编辑链接">
				<a className="data-icon data-icon-edit" onClick={onEdit} />
			</Tooltip>
			<Tooltip title="取消链接">
				<a className="data-icon data-icon-unlink" onClick={onRemove} />
			</Tooltip>
		</div>
	);
};

export default LinkPreview;
