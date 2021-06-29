import { merge, omit } from 'lodash-es';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from 'react';
import classnames from 'classnames-es-ts';
import { EngineInterface, isMobile } from '@aomao/engine';
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

type GroupItemDataProps = {
	icon?: React.ReactNode;
	content?: React.ReactNode | (() => React.ReactNode);
	items: Array<ToolbarItemProps | string>;
};

type GroupItemProps = Array<ToolbarItemProps | string> | GroupItemDataProps;

type GroupProps = Omit<GroupItemDataProps, 'items'> & {
	items: Array<ToolbarItemProps>;
};

export type ToolbarProps = {
	engine: EngineInterface;
	items: Array<GroupItemProps>;
	className?: string;
};

const Toolbar: React.FC<ToolbarProps> = ({ engine, className, items = [] }) => {
	const [data, setData] = useState<Array<GroupProps>>([]);
	//移动端浏览器视图信息
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const [mobileView, setMobileView] = useState({ top: 0 });
	//计算移动浏览器的视图变化
	const calcuMobileView = () => {
		const rect = toolbarRef.current?.getBoundingClientRect();
		const height = rect?.height || 0;
		setMobileView({
			top:
				global.Math.max(
					document.body.scrollTop,
					document.documentElement.scrollTop,
				) +
				(window.visualViewport.height || 0) -
				height,
		});
	};
	/**
	 * 更新状态
	 */
	const updateState = useCallback(() => {
		if (isMobile) calcuMobileView();
		const data: Array<GroupProps> = [];
		const defaultConfig = getToolbarDefaultConfig(engine);
		items.forEach((group) => {
			const dataGroup: GroupProps = { items: [] };
			if (!Array.isArray(group)) {
				dataGroup.icon = group.icon;
				dataGroup.content = group.content;

				group = group.items;
			}
			group.forEach((item) => {
				let customItem = undefined;
				if (typeof item === 'string') {
					const defaultItem = defaultConfig.find((config) =>
						item === 'collapse'
							? config.type === item
							: config.type !== 'collapse' &&
							  config.name === item,
					);
					if (defaultItem) customItem = defaultItem;
				} else {
					const defaultItem = defaultConfig.find((config) =>
						item.type === 'collapse'
							? config.type === item.type
							: config.type !== 'collapse' &&
							  config.name === item.name,
					);
					customItem = merge(
						defaultItem ? omit(item, 'type') : item,
						defaultItem,
					);
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
					dataGroup.items.push(customItem);
				}
			});
			if (dataGroup.items.length > 0) data.push(dataGroup);
		});
		setData(data);
	}, [engine, items]);

	useMemo(() => {
		updateState();
	}, [engine, items]);

	useEffect(() => {
		engine.language.add(locales);
		engine.on('select', updateState);
		engine.on('change', updateState);

		let scrollTimer: NodeJS.Timeout;

		const hideMobileToolbar = () => {
			setMobileView({
				top: -120,
			});
			clearTimeout(scrollTimer);
			scrollTimer = setTimeout(() => {
				calcuMobileView();
			}, 200);
		};

		if (isMobile) {
			document.addEventListener('scroll', hideMobileToolbar);
			visualViewport.addEventListener('resize', calcuMobileView);
			visualViewport.addEventListener('scroll', calcuMobileView);
		}

		return () => {
			engine.off('select', updateState);
			engine.off('change', updateState);
			if (isMobile) {
				document.removeEventListener('scroll', hideMobileToolbar);
				visualViewport.removeEventListener('resize', calcuMobileView);
				visualViewport.removeEventListener('scroll', calcuMobileView);
			}
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
			ref={toolbarRef}
			className={classnames('editor-toolbar', className, {
				'editor-toolbar-mobile': isMobile,
			})}
			style={isMobile ? { top: `${mobileView.top}px` } : {}}
			data-element="ui"
			onMouseDown={onMouseDown}
			onMouseOver={(event) => event.preventDefault()}
			onMouseMove={(event) => event.preventDefault()}
			onContextMenu={(event) => event.preventDefault()}
		>
			<div className="editor-toolbar-content">
				{data.map((group, index) => (
					<ToolbarGroup key={index} engine={engine} {...group} />
				))}
			</div>
		</div>
	);
};

export default Toolbar;
export { ToolbarPlugin, ToolbarComponent };
