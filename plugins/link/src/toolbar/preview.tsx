import React from 'react';
import classnames from 'classnames-es-ts';
import { isMobile, LanguageInterface } from '@aomao/engine';
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
	const renderEdit = () => {
		const editButton = (
			<a className="data-icon data-icon-edit" onClick={onEdit} />
		);
		return isMobile ? (
			editButton
		) : (
			<Tooltip title={language.get('link', 'link_edit')}>
				{editButton}
			</Tooltip>
		);
	};
	const renderRemove = () => {
		const removeButton = (
			<a className="data-icon data-icon-unlink" onClick={onRemove} />
		);
		return isMobile ? (
			removeButton
		) : (
			<Tooltip title={language.get('link', 'link_remove')}>
				{removeButton}
			</Tooltip>
		);
	};
	return (
		<div className={classnames('data-link-preview')} data-element="ui">
			<Tooltip title={language.get('link', 'link_open')}>
				<a
					className="data-icon data-icon-link data-link-preview-open"
					href={href}
					target="_blank"
				>
					{href}
				</a>
			</Tooltip>
			<div className="data-link-op">
				{renderEdit()}
				{renderRemove()}
			</div>
		</div>
	);
};

export default LinkPreview;
