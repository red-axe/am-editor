import React, { useEffect, useRef, useState } from 'react';
import { EngineInterface } from '@aomao/engine';
import classnames from 'classnames';
import Button from '../button';
import CollapseGroup, { CollapseGroupProps } from './group';
import './index.css';

export type CollapseProps = {
	header: React.ReactNode;
	groups: Array<CollapseGroupProps>;
	engine?: EngineInterface;
	className?: string;
	icon?: React.ReactNode;
	content?: React.ReactNode | (() => React.ReactNode);
};

const Collapse: React.FC<CollapseProps> = ({
	icon,
	content,
	header,
	groups,
	engine,
	className,
}) => {
	const [visible, setVisible] = useState(false);
	const collapseRef = useRef();

	useEffect(() => {
		return () => document.removeEventListener('click', hide);
	}, []);

	const show = () => {
		document.addEventListener('click', hide);
		setVisible(true);
	};

	const hide = (event?: MouseEvent) => {
		if (event) {
			let node = event.target;
			while (node) {
				if (node === collapseRef.current) {
					return;
				}
				node = (node as Element).parentNode;
			}
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
				className,
			)}
			ref={collapseRef.current}
		>
			<Button
				name="collapse"
				icon={icon}
				content={content}
				onClick={toggle}
				active={visible}
			/>
			{visible && (
				<div
					className="toolbar-dropdown-list"
					data-element-ui="collapse"
				>
					{typeof header === 'string' ? (
						<div
							className="toolbar-collapse-header"
							dangerouslySetInnerHTML={{ __html: header }}
						/>
					) : (
						<div className="toolbar-collapse-header">{header}</div>
					)}
					<div className="toolbar-collapse-content">
						{groups.map((group, index) => {
							return (
								<CollapseGroup
									key={index}
									engine={engine}
									{...group}
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
