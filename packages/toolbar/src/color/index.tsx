import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import { EngineInterface } from '@aomao/engine';
import Button from '../button';
import ColorPicker, { ColorPickerProps, Palette } from './picker';
import './index.css';

export type ColorButtonProps = {
	name: string;
	content:
		| string
		| ((
				color: string,
				stroke: string,
				disabled?: boolean,
		  ) => React.ReactNode);
	buttonTitle?: string;
	dropdownTitle?: string;
	command?: { name: string; args: Array<any> } | Array<any>;
	autoExecute?: boolean;
	engine?: EngineInterface;
	disabled?: boolean;
} & ColorPickerProps;

const ColorButton: React.FC<ColorButtonProps> = ({
	engine,
	autoExecute,
	command,
	name,
	content,
	buttonTitle,
	dropdownTitle,
	disabled,
	colors,
	defaultActiveColor,
	defaultColor,
	onSelect,
	setStroke,
}) => {
	const [pickerVisible, setPickerVisible] = useState(false);
	const [buttonContent, setButtonContent] = useState(
		typeof content === 'string'
			? content
			: content(
					defaultActiveColor,
					Palette.getStroke(defaultActiveColor),
					disabled,
			  ),
	);
	const [currentColor, setCurrentColor] = useState(defaultActiveColor);
	const toggleDropdown = (event: React.MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();

		if (pickerVisible) {
			hideDropdown();
		} else {
			showDropdown();
		}
	};

	const showDropdown = () => {
		document.addEventListener('click', hideDropdown);
		setPickerVisible(true);
	};

	const hideDropdown = (event?: MouseEvent) => {
		if (event && (event.target as Element).closest('[data-element="ui"]'))
			return;
		document.removeEventListener('click', hideDropdown);
		setPickerVisible(false);
	};

	const triggerSelect = (color: string, event: React.MouseEvent) => {
		setCurrentColor(color);
		setButtonContent(
			typeof content === 'string'
				? content
				: content(color, Palette.getStroke(color), disabled),
		);
		if (autoExecute !== false) {
			let commandName = name;
			let commandArgs = [color, defaultColor];
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
		if (onSelect) onSelect(color, event);
	};

	useEffect(() => {
		return () => {
			document.removeEventListener('click', hideDropdown);
		};
	}, []);

	return (
		<div className="toolbar-dropdown colorpicker-button">
			<div
				className={classNames(
					'toolbar-dropdown-trigger colorpicker-button-group',
					{ 'colorpicker-button-group-active': pickerVisible },
				)}
			>
				<Button
					className="colorpicker-button-text"
					name={name}
					title={buttonTitle}
					content={buttonContent}
					onClick={event => triggerSelect(currentColor, event)}
				/>
				<Button
					className="colorpicker-button-dropdown toolbar-dropdown-trigger-arrow"
					name={name}
					title={dropdownTitle}
					icon={
						<span className="colorpicker-button-dropdown-empty" />
					}
					content={<span className="data-icon data-icon-arrow" />}
					onClick={toggleDropdown}
				/>
			</div>
			{pickerVisible && (
				<div className="toolbar-dropdown-list" data-element="ui">
					<ColorPicker
						engine={engine}
						colors={colors}
						defaultActiveColor={currentColor}
						defaultColor={defaultColor}
						onSelect={triggerSelect}
						setStroke={setStroke}
					/>
				</div>
			)}
		</div>
	);
};

export default ColorButton;
