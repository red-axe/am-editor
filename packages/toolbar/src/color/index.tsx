import React, { useEffect, useState, useRef, useCallback } from 'react';
import classNames from 'classnames-es-ts';
import type { EngineInterface, Placement } from '@aomao/engine';
import { useRight } from '../hooks';
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
	placement?: Placement;
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
	placement,
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
	const targetRef = useRef<HTMLButtonElement | null>(null);
	const buttonRef = useRef<HTMLDivElement | null>(null);
	const isRight = useRight(buttonRef);

	useEffect(() => {
		setButtonContent(
			typeof content === 'string'
				? content
				: content(
						currentColor,
						Palette.getStroke(currentColor),
						disabled,
				  ),
		);
	}, [content, disabled, currentColor]);

	const element = useRef<HTMLDivElement>(null);
	const [listPlacement, setListPlacement] = useState<'bottom' | 'top'>();

	useEffect(() => {
		const current = element.current;
		if (!current || !pickerVisible) return;
		const scrollElement = engine?.scrollNode?.get<HTMLElement>();
		if (!scrollElement) return;
		const rect = current.getBoundingClientRect();
		const scrollRect = scrollElement.getBoundingClientRect();
		if (rect.top < scrollRect.top) setListPlacement('bottom');
		if (rect.bottom > scrollRect.bottom) setListPlacement('top');
	}, [pickerVisible, element]);

	const toggleDropdown = (event: React.MouseEvent) => {
		event.preventDefault();
		if (pickerVisible) {
			hideDropdown();
		} else {
			showDropdown();
		}
	};

	useEffect(() => {
		if (pickerVisible) document.addEventListener('click', hideDropdown);
		return () => {
			document.removeEventListener('click', hideDropdown);
		};
	}, [pickerVisible]);

	const showDropdown = useCallback(() => {
		setPickerVisible(true);
	}, []);

	const hideDropdown = useCallback((event?: MouseEvent) => {
		if (
			event &&
			targetRef.current &&
			targetRef.current.contains(event.target as Node)
		)
			return;
		setPickerVisible(false);
	}, []);

	const triggerSelect = (color: string, event: React.MouseEvent) => {
		setCurrentColor(color);
		hideDropdown();
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

	return (
		<div
			ref={buttonRef}
			className={classNames('toolbar-dropdown', 'colorpicker-button', {
				'toolbar-dropdown-right': isRight,
			})}
		>
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
					disabled={disabled}
					onClick={(event) => triggerSelect(currentColor, event)}
					placement={placement}
				/>
				<Button
					className="colorpicker-button-dropdown toolbar-dropdown-trigger-arrow"
					name={name}
					title={dropdownTitle}
					disabled={disabled}
					icon={
						<span className="colorpicker-button-dropdown-empty" />
					}
					content={<span className="data-icon data-icon-arrow" />}
					onClick={toggleDropdown}
					placement={placement}
					ref={targetRef}
				/>
			</div>
			{pickerVisible && (
				<div
					ref={element}
					className={classNames(
						'toolbar-dropdown-list',
						listPlacement
							? `toolbar-dropdown-placement-${listPlacement}`
							: '',
					)}
					data-element="ui"
				>
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
