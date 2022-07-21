import React, { useState } from 'react';
import classnames from 'classnames-es-ts';
import { EngineInterface, Placement } from '@aomao/engine';
import Popover from 'antd/es/popover';
import 'antd/es/popover/style';

export type CollapseItemProps = {
	name: string;
	engine?: EngineInterface;
	icon?: React.ReactNode;
	title?: React.ReactNode | (() => React.ReactNode);
	search?: string;
	description?: React.ReactNode | (() => React.ReactNode);
	prompt?: React.ReactNode | ((props: CollapseItemProps) => React.ReactNode);
	command?: { name: string; args: Array<any> } | Array<any>;
	autoExecute?: boolean;
	disabled?: boolean;
	onDisabled?: () => boolean;
	className?: string;
	placement?: Placement;
	onClick?: (
		event: React.MouseEvent,
		name: string,
		engine?: EngineInterface,
	) => void | boolean;
	onMouseDown?: (event: React.MouseEvent, engine?: EngineInterface) => void;
};

const CollapseItem: React.FC<CollapseItemProps> = (props) => {
	const [active, setActive] = useState(false);
	const {
		engine,
		name,
		icon,
		title,
		disabled,
		description,
		className,
		prompt,
		placement,
	} = props;
	const onClick = (event: React.MouseEvent) => {
		if (disabled) return;
		const { command, onClick, autoExecute } = props;

		const nodeName = (event.target as Node).nodeName;
		if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
			event.preventDefault();

		if (onClick && onClick(event, name, engine) === false) {
			return;
		}
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
	};

	const onMouseDown = (event: React.MouseEvent) => {
		if (props.onMouseDown) props.onMouseDown(event, engine);
	};

	const render = () => {
		return (
			<div
				className={classnames(
					'toolbar-collapse-item',
					{ 'toolbar-collapse-item-active': active },
					{ 'toolbar-collapse-item-disabled': disabled },
					className,
				)}
				onMouseEnter={() => setActive(disabled ? false : true)}
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
							{typeof title === 'function' ? title() : title}
						</div>
						{description && (
							<div className="toolbar-collapse-item-description">
								{typeof description === 'function'
									? description()
									: description}
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
			content={
				<div
					onClick={(event) => {
						if (props.onClick) {
							event.preventDefault();
							props.onClick(event, name, engine);
						}
					}}
				>
					{typeof prompt === 'function' ? prompt(props) : prompt}
				</div>
			}
		>
			{render()}
		</Popover>
	) : (
		render()
	);
};

export default CollapseItem;
