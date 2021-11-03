import React from 'react';
import { EngineInterface } from '@aomao/engine';
import ColorPickerItem from './item';

export type ColorPickerGroupProps = {
	engine: EngineInterface;
	colors: Array<string>;
	activeColors: Array<string>;
	setStroke?: boolean;
	onSelect?: (color: string, event: React.MouseEvent) => void;
};

const ColorPickerGroup: React.FC<ColorPickerGroupProps> = ({
	engine,
	colors,
	activeColors,
	onSelect,
	setStroke,
}) => {
	return (
		<span className="colorpicker-group">
			{colors.map((color) => {
				return (
					<ColorPickerItem
						engine={engine}
						color={color}
						key={color}
						activeColors={activeColors}
						onSelect={onSelect}
						setStroke={setStroke}
					/>
				);
			})}
		</span>
	);
};

export default ColorPickerGroup;
