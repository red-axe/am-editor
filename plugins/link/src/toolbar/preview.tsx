import React from 'react';
import classnames from 'classnames-es-ts';
import { LanguageInterface } from '@aomao/engine';
import Tooltip from 'antd/es/tooltip';
import 'antd/es/tooltip/style';

export type LinkPreviewProps = {
	language: LanguageInterface;
	href?: string;
	className?: string;
	onEdit: (event: React.MouseEvent) => void;
	onRemove: (event: React.MouseEvent) => void;
};

const LinkPreview: React.FC<LinkPreviewProps> = ({
	language,
	href,
	onEdit,
	onRemove,
}) => {
	return (
		<div className={classnames('data-link-preview')}>
			<Tooltip title={language.get('link', 'link_open')}>
				<a
					className="data-icon data-icon-link data-link-preview-open"
					href={href}
					target="_blank"
				>
					{href}
				</a>
			</Tooltip>
			<Tooltip title={language.get('link', 'link_edit')}>
				<a className="data-icon data-icon-edit" onClick={onEdit} />
			</Tooltip>
			<Tooltip title={language.get('link', 'link_remove')}>
				<a className="data-icon data-icon-unlink" onClick={onRemove} />
			</Tooltip>
		</div>
	);
};

export default LinkPreview;
