import React from 'react';
import { EngineInterface } from '@aomao/engine';
import CollapseItem, { CollapseItemProps } from './item';

export type CollapseGroupProps = {
	engine?: EngineInterface;
	title?: React.ReactNode;
	items: Array<Omit<CollapseItemProps, 'engine'>>;
	onSelect?: (event: React.MouseEvent, name: string) => void | boolean;
};

const CollapseGroup: React.FC<CollapseGroupProps> = ({
	engine,
	title,
	items,
	onSelect,
}) => {
	return (
		<div className="toolbar-collapse-group">
			{title && (
				<div className="toolbar-collapse-group-title">{title}</div>
			)}
			{items.map(item => {
				return (
					<CollapseItem
						key={item.name}
						engine={engine}
						{...item}
						onClick={onSelect}
					/>
				);
			})}
		</div>
	);
};

export default CollapseGroup;
