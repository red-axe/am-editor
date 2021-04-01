import { merge, omit } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import { EngineInterface } from '@aomao/engine';
import ToolbarGroup from './group';
import { getToolbarDefaultConfig } from './config/toolbar';
import { ButtonProps, DropdownProps, ColorProps, CollapseProps } from './types';
import ToolbarPlugin, { ToolbarComponent } from './plugin';
import locales from './locales';
import './index.css';

type ToolbarItemProps =
	| ButtonProps
	| DropdownProps
	| ColorProps
	| CollapseProps;

export type ToolbarProps = {
	engine: EngineInterface;
	items: Array<Array<ToolbarItemProps | string>>;
	className?: string;
};

const Toolbar: React.FC<ToolbarProps> = ({ engine, className, items = [] }) => {
	const [data, setData] = useState<Array<Array<ToolbarItemProps>>>([]);

	/**
	 * 更新状态
	 */
	const updateState = useCallback(() => {
		const data: Array<Array<ToolbarItemProps>> = [];
		const defaultConfig = getToolbarDefaultConfig(engine);
		items.forEach(group => {
			const dataGroup: Array<ToolbarItemProps> = [];
			group.forEach(item => {
				let customItem = undefined;
				if (typeof item === 'string') {
					const defaultItem = defaultConfig.find(config =>
						item === 'collapse'
							? config.type === item
							: config.type !== 'collapse' &&
							  config.name === item,
					);
					if (defaultItem) customItem = defaultItem;
				} else {
					const defaultItem = defaultConfig.find(config =>
						item.type === 'collapse'
							? config.type === item.type
							: config.type !== 'collapse' &&
							  config.name === item.name,
					);
					customItem = merge(omit(item, 'type'), defaultItem);
				}
				if (customItem) {
					if (customItem.type === 'button') {
						if (customItem.onActive)
							customItem.active = customItem.onActive();
						else if (engine.command.queryEnabled(customItem.name))
							customItem.active = engine.command.queryState(
								customItem.name,
							);
					} else if (customItem.type === 'dropdown') {
						if (customItem.onActive)
							customItem.values = customItem.onActive();
						else if (engine.command.queryEnabled(customItem.name))
							customItem.values = engine.command.queryState(
								customItem.name,
							);
					}
					if (customItem.type !== 'collapse' && customItem.onDisabled)
						customItem.disabled = customItem.onDisabled();
					dataGroup.push(customItem);
				}
			});
			if (dataGroup.length > 0) data.push(dataGroup);
		});
		setData(data);
	}, [engine, items]);

	useMemo(() => {
		engine.language.add(locales);
		updateState();
	}, [engine, items]);

	useEffect(() => {
		engine.on('select', updateState);
		engine.on('change', updateState);

		return () => {
			engine.off('select', updateState);
			engine.off('change', updateState);
		};
	}, [engine]);

	const onMouseDown = (
		event: React.MouseEvent<HTMLDivElement, MouseEvent>,
	) => {
		const nodeName = (event.target as Node).nodeName;
		if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA')
			event.preventDefault();
	};

	return (
		<div
			className={classnames('editor-toolbar', className)}
			data-element="ui"
			onMouseDown={onMouseDown}
			onMouseOver={event => event.preventDefault()}
			onMouseMove={event => event.preventDefault()}
			onContextMenu={event => event.preventDefault()}
		>
			<div className="editor-toolbar-content">
				{data.map((group, index) => (
					<ToolbarGroup key={index} engine={engine} items={group} />
				))}
			</div>
		</div>
	);
};

export default Toolbar;
export { ToolbarPlugin, ToolbarComponent };
