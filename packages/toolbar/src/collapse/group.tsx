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
			{items.map((item) => {
				return (
					<CollapseItem
						key={item.name}
						engine={engine}
						{...item}
						onClick={(event, name) => {
							let result;
							if (item.onClick)
								result = item.onClick(event, name);
							if (onSelect) onSelect(event, name);
							return result;
						}}
					/>
				);
			})}
		</div>
	);
};

export default CollapseGroup;
