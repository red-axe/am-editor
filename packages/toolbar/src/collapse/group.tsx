import React from 'react';
import { EngineInterface } from '@aomao/engine';
import CollapseItem, { CollapseItemProps } from './item';

export type CollapseGroupProps = {
	engine?: EngineInterface;
	title?: React.ReactNode;
	items: Array<Omit<CollapseItemProps, 'engine'>>;
};

const CollapseGroup: React.FC<CollapseGroupProps> = ({
	engine,
	title,
	items,
}) => {
	return (
		<div className="toolbar-collapse-group">
			{title && <div>{title}</div>}
			{items.map(item => {
				return (
					<CollapseItem key={item.name} engine={engine} {...item} />
				);
			})}
		</div>
	);
};

export default CollapseGroup;
