import React, { useState } from 'react';
import classnames from 'classnames';
import { EngineInterface } from '@aomao/engine';
import { Popover } from 'antd';
import 'antd/lib/popover/style';

export type CollapseItemProps = {
	name: string;
	engine?: EngineInterface;
	icon?: React.ReactNode;
	title?: React.ReactNode | (() => React.ReactNode);
	description?: React.ReactNode | (() => React.ReactNode);
	prompt?: React.ReactNode | (() => React.ReactNode);
	command?: { name: string; args: Array<any> } | Array<any>;
	autoExecute?: boolean;
	className?: string;
	placement?:
		| 'right'
		| 'top'
		| 'left'
		| 'bottom'
		| 'topLeft'
		| 'topRight'
		| 'bottomLeft'
		| 'bottomRight'
		| 'leftTop'
		| 'leftBottom'
		| 'rightTop'
		| 'rightBottom';
	onClick?: (event: React.MouseEvent) => void;
	onMouseDown?: (event: React.MouseEvent) => void;
};

const CollapseItem: React.FC<CollapseItemProps> = ({
	engine,
	name,
	icon,
	title,
	description,
	className,
	prompt,
	placement,
	onMouseDown,
	...props
}) => {
	const [active, setActive] = useState(false);

	const onClick = (event: React.MouseEvent) => {
		const { command, onClick, autoExecute } = props;

		const nodeName = (event.target as Node).nodeName;
		if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
			event.preventDefault();

		if (autoExecute !== false) {
			let commandName = name;
			let commandArgs = [];
			if (command) {
				if (!Array.isArray(command)) {
					commandName = command.name;
					commandArgs = command.args;
				} else {
					commandArgs = command;
				}
			}
			engine?.command.execute(commandName, ...commandArgs);
		}
		if (onClick) onClick(event);
	};

	const render = () => {
		return (
			<div
				className={classnames(
					'toolbar-collapse-item',
					{ 'toolbar-collapse-item-active': active },
					className,
				)}
				onMouseEnter={() => setActive(true)}
				onMouseLeave={() => setActive(false)}
				onClick={onClick}
				onMouseDown={onMouseDown}
			>
				{typeof icon === 'string' ? (
					<span className={`data-icon data-icon-${icon}`} />
				) : (
					icon
				)}
				{title && (
					<div className="toolbar-collapse-item-text">
						<div className="toolbar-collapse-item-title">
							{title}
						</div>
						{description && (
							<div className="toolbar-collapse-item-description">
								{description}
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	return prompt ? (
		<Popover
			placement={placement || 'right'}
			content={typeof prompt === 'function' ? prompt() : prompt}
		>
			{render()}
		</Popover>
	) : (
		render()
	);
};

export default CollapseItem;
