import React, { useState } from 'react';
import { Tooltip } from 'antd';
import classnames from 'classnames-es-ts';
import { EngineInterface, formatHotkey } from '@aomao/engine';
import { autoGetHotkey } from '../utils';
import 'antd/lib/tooltip/style';
import './index.css';

export type ButtonProps = {
	engine?: EngineInterface;
	name: string;
	icon?: React.ReactNode;
	content?: React.ReactNode | (() => React.ReactNode);
	title?: string;
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
	hotkey?: boolean | string;
	command?: { name: string; args: Array<any> } | Array<any>;
	autoExecute?: boolean;
	className?: string;
	active?: boolean;
	disabled?: boolean;
	onClick?: (event: React.MouseEvent) => void | boolean;
	onMouseDown?: (event: React.MouseEvent) => void;
	onMouseEnter?: (event: React.MouseEvent) => void;
	onMouseLeave?: (event: React.MouseEvent) => void;
};

const ToolbarButton: React.FC<ButtonProps> = props => {
	const { name, engine, command } = props;

	const [tooltipVisible, setTooltipVisible] = useState(false);

	const onClick = (event: React.MouseEvent) => {
		const { command, onClick, disabled, autoExecute } = props;

		const nodeName = (event.target as Node).nodeName;
		if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
			event.preventDefault();

		if (disabled) return;
		if (onClick && onClick(event) === false) return;
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
		if (onMouseDown) onMouseDown(event);
		else {
			event.stopPropagation();
		}

		setTooltipVisible(false);
	};

	const onMouseEnter = (event: React.MouseEvent) => {
		const { onMouseEnter } = props;
		if (onMouseEnter) {
			onMouseEnter(event);
		}
		setTooltipVisible(true);
	};

	const onMouseLeave = (event: React.MouseEvent) => {
		const { onMouseLeave } = props;
		if (onMouseLeave) {
			onMouseLeave(event);
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
				{typeof content === 'function' ? content() : content}
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
	return title ? (
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
};

export default ToolbarButton;
