import React, { useEffect, useRef, useState } from 'react';
import { EngineInterface } from '@aomao/engine';
import classnames from 'classnames-es-ts';
import Button from '../button';
import { useRight } from '../hooks';
import CollapseGroup, { CollapseGroupProps } from './group';
import './index.css';

export type CollapseProps = {
	header?: React.ReactNode;
	groups: Array<CollapseGroupProps>;
	engine?: EngineInterface;
	className?: string;
	icon?: React.ReactNode;
	content?: React.ReactNode | ((engine?: EngineInterface) => React.ReactNode);
	onSelect?: (event: React.MouseEvent, name: string) => void | boolean;
};

const Collapse: React.FC<CollapseProps> = ({
	icon,
	content,
	header,
	groups,
	engine,
	className,
	onSelect,
}) => {
	const isCustomize = !!!(icon || content);
	const [visible, setVisible] = useState(isCustomize);

	const collapseRef = useRef<HTMLDivElement | null>(null);
	const isRight = useRight(collapseRef);

	useEffect(() => {
		if (!isCustomize)
			return () => document.removeEventListener('click', hide);
		return;
	}, [isCustomize]);

	const show = () => {
		setVisible(true);
		setTimeout(() => {
			document.addEventListener('click', hide);
		}, 10);
	};

	const hide = (event?: MouseEvent) => {
		if (event) {
			let node = event.target;
			// while (node) {
			// 	if (node === collapseRef.current) {
			// 		return;
			// 	}
			// 	node = (node as Element).parentNode;
			// }
		}
		document.removeEventListener('click', hide);
		setVisible(false);
	};

	const toggle = () => {
		if (visible) {
			hide();
		} else {
			show();
		}
	};

	return (
		<div
			className={classnames(
				'toolbar-dropdown toolbar-collapse',
				{ 'toolbar-dropdown-right': isRight },
				className,
			)}
			ref={collapseRef}
		>
			{!isCustomize && (
				<Button
					name="collapse"
					icon={icon}
					content={content}
					onClick={toggle}
					active={visible}
					disabled={
						!groups.some((g) =>
							g.items.some((item) => !item.disabled),
						)
					}
				/>
			)}
			{visible && (
				<div className="toolbar-dropdown-list" data-element="ui">
					{typeof header === 'string' ? (
						<div
							className="toolbar-collapse-header"
							dangerouslySetInnerHTML={{ __html: header }}
						/>
					) : (
						header && (
							<div className="toolbar-collapse-header">
								{header}
							</div>
						)
					)}
					<div className="toolbar-collapse-content">
						{groups.map((group, index) => {
							return (
								<CollapseGroup
									key={index}
									engine={engine}
									{...group}
									onSelect={onSelect}
								/>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};

export default Collapse;
