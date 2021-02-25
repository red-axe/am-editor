import React from 'react';
import { EngineInterface } from '@aomao/engine';
import Button, { ButtonProps } from '../button';
import Dropdown, { DropdownProps } from '../dropdown';
import ColorButton, { ColorButtonProps } from '../color';
import './index.css';

export type GroupButtonProps = {
	type: 'button';
} & Omit<ButtonProps, 'engine'>;

export type GroupDropdownProps = {
	type: 'dropdown';
} & Omit<DropdownProps, 'engine'>;

export type GroupColorProps = {
	type: 'color';
} & Omit<ColorButtonProps, 'engine'>;

export type GroupProps = {
	engine: EngineInterface;
	items: Array<GroupButtonProps | GroupDropdownProps | GroupColorProps>;
};

const ToolbarGroup: React.FC<GroupProps> = ({ engine, items }) => {
	return (
		<div className="editor-toolbar-group">
			{items.map(item => {
				switch (item.type) {
					case 'button':
						return (
							<Button engine={engine} key={item.name} {...item} />
						);
					case 'dropdown':
						return (
							<Dropdown
								engine={engine}
								key={item.name}
								{...item}
							/>
						);
					case 'color':
						return (
							<ColorButton
								engine={engine}
								key={item.name}
								{...item}
							/>
						);
				}
			})}
		</div>
	);
};

export default ToolbarGroup;
