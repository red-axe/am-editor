import React, { useState } from 'react';
import { EngineInterface } from '@aomao/engine';
import ColorPickerGroup, { ColorPickerGroupProps } from './group';
import Palette from './palette';
import ColorPickerItem from './item';
import './index.css';

export type ColorPickerProps = {
	engine: EngineInterface;
	colors?: Array<Array<string>>;
	defaultColor: string;
	defaultActiveColor: string;
} & Omit<ColorPickerGroupProps, 'colors' | 'activeColors'>;

const ColorPicker: React.FC<ColorPickerProps> = ({
	engine,
	colors,
	defaultActiveColor,
	defaultColor,
	onSelect,
	setStroke,
}) => {
	const [active, setActive] = useState([defaultActiveColor]);
	if (!colors) colors = Palette.getColors();

	const triggerSelect = (color: string, event: React.MouseEvent) => {
		setActive([color]);
		if (onSelect) onSelect(color, event);
	};

	return (
		<div
			className="colorpicker-board"
			onMouseDown={(event) => {
				if ('INPUT' !== (event.target as Element).tagName) {
					event.preventDefault();
				}
			}}
		>
			<div
				className="colorpicker-default"
				onClick={(event) => triggerSelect(defaultColor, event)}
			>
				<ColorPickerItem
					engine={engine}
					color={defaultColor}
					activeColors={[]}
					onSelect={triggerSelect}
				/>
				<span className="colorpicker-default-text">
					{engine.language
						.get(
							'toolbar',
							'colorPicker',
							defaultColor === 'transparent'
								? 'nonFillText'
								: 'defaultText',
						)
						.toString()}
				</span>
			</div>
			{colors.map((data, index) => {
				return (
					<ColorPickerGroup
						engine={engine}
						colors={data}
						key={index}
						activeColors={active}
						onSelect={triggerSelect}
						setStroke={setStroke}
					/>
				);
			})}
		</div>
	);
};

export default ColorPicker;

export { Palette };
