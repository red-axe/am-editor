import React, { useState } from 'react';
import Tooltip from 'antd/es/tooltip';
import classnames from 'classnames-es-ts';
import { formatHotkey, isMobile } from '@aomao/engine';
import type { EngineInterface, Placement } from '@aomao/engine';
import { autoGetHotkey } from '../utils';
import 'antd/es/tooltip/style/css';
import './index.css';

export type ButtonProps = {
	engine?: EngineInterface;
	name: string;
	icon?: React.ReactNode;
	content?: React.ReactNode | ((engine?: EngineInterface) => React.ReactNode);
	title?: string;
	placement?: Placement;
	hotkey?: boolean | string;
	command?: { name: string; args: Array<any> } | Array<any>;
	autoExecute?: boolean;
	className?: string;
	active?: boolean;
	disabled?: boolean;
	onClick?: (
		event: React.MouseEvent,
		engine?: EngineInterface,
	) => void | boolean;
	onMouseDown?: (event: React.MouseEvent, engine?: EngineInterface) => void;
	onMouseEnter?: (event: React.MouseEvent, engine?: EngineInterface) => void;
	onMouseLeave?: (event: React.MouseEvent, engine?: EngineInterface) => void;
};

const ToolbarButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
	(props, ref) => {
		const { name, engine, command } = props;

		const [tooltipVisible, setTooltipVisible] = useState(false);

		const onClick = (event: React.MouseEvent) => {
			const { command, onClick, disabled, autoExecute } = props;

			const nodeName = (event.target as Node).nodeName;
			if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
				event.preventDefault();

			if (disabled) return;
			if (onClick && onClick(event, engine) === false) return;
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
			event.preventDefault();
			const { onMouseDown, disabled } = props;
			if (disabled) return;
			if (onMouseDown) onMouseDown(event, engine);

			setTooltipVisible(false);
		};

		const onMouseEnter = (event: React.MouseEvent) => {
			const { onMouseEnter } = props;
			if (onMouseEnter) {
				onMouseEnter(event, engine);
			}
			setTooltipVisible(true);
		};

		const onMouseLeave = (event: React.MouseEvent) => {
			const { onMouseLeave } = props;
			if (onMouseLeave) {
				onMouseLeave(event, engine);
			}
			setTooltipVisible(false);
		};

		const renderButton = () => {
			const { icon, content, className, active, disabled } = props;
			return (
				<button
					className={classnames('toolbar-button', className, {
						'toolbar-button-active': active,
						'toolbar-button-disabled': disabled,
					})}
					ref={ref}
					onClick={onClick}
					onMouseDown={onMouseDown}
					onMouseEnter={onMouseEnter}
					onMouseLeave={onMouseLeave}
				>
					{typeof icon === 'string' ? (
						<span className={`data-icon data-icon-${icon}`} />
					) : (
						icon
					)}
					{typeof content === 'function' ? content(engine) : content}
				</button>
			);
		};

		let title = props.title ? (
			<div className="toolbar-tooltip-title">{props.title}</div>
		) : null;
		let hotkey = props.hotkey;
		//默认获取插件的热键
		if (engine && (hotkey === true || hotkey === undefined)) {
			hotkey = autoGetHotkey(
				engine,
				command && !Array.isArray(command) ? command.name : name,
			);
		}
		if (typeof hotkey === 'string' && hotkey !== '') {
			title = (
				<>
					{title}
					<div className="toolbar-tooltip-hotkey">
						{formatHotkey(hotkey)}
					</div>
				</>
			);
		}
		return title && !isMobile ? (
			<Tooltip
				placement={props.placement || 'bottom'}
				title={title}
				visible={tooltipVisible}
			>
				{renderButton()}
			</Tooltip>
		) : (
			renderButton()
		);
	},
);

export default ToolbarButton;
