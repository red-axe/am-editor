import React from 'react';
import classnames from 'classnames-es-ts';
import { isMobile, LanguageInterface } from '@aomao/engine';
import Tooltip from 'antd/es/tooltip';
import 'antd/es/tooltip/style/css';

export type LinkPreviewProps = {
	language: LanguageInterface;
	href?: string;
	className?: string;
	readonly: boolean;
	onEdit: (event: React.MouseEvent) => void;
	onRemove: (event: React.MouseEvent) => void;
};

const LinkPreview: React.FC<LinkPreviewProps> = ({
	language,
	readonly,
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
			<Tooltip title={language.get('link', 'link_edit').toString()}>
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
			<Tooltip title={language.get('link', 'link_remove').toString()}>
				{removeButton}
			</Tooltip>
		);
	};
	return (
		<div className={classnames('data-link-preview')} data-element="ui">
			<Tooltip title={language.get('link', 'link_open').toString()}>
				<a
					className="data-icon data-icon-link data-link-preview-open"
					href={href}
					target="_blank"
				>
					{href}
				</a>
			</Tooltip>
			{!readonly && (
				<div className="data-link-op">
					{renderEdit()}
					{renderRemove()}
				</div>
			)}
		</div>
	);
};

export default LinkPreview;
