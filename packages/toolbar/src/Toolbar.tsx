import merge from 'lodash/merge';
import omit from 'lodash/omit';
import React, {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useRef,
} from 'react';
import classnames from 'classnames-es-ts';
import { EngineInterface, isMobile, removeUnit } from '@aomao/engine';
import ToolbarGroup from './group';
import {
	getToolbarDefaultConfig,
	fontFamilyDefaultData,
	fontfamily,
} from './config/toolbar';
import { ButtonProps, DropdownProps, ColorProps, CollapseProps } from './types';
import { CollapseGroupProps } from './collapse/group';
import { CollapseItemProps } from './collapse/item';
import locales from './locales';
import './index.css';

export type ToolbarItemProps =
	| ButtonProps
	| DropdownProps
	| ColorProps
	| CollapseProps;

type GroupItemDataProps = {
	// 分组图标-mobile
	icon?: React.ReactNode;
	// 分组内容-mobile
	content?: React.ReactNode | (() => React.ReactNode);
	// 子项
	items: Array<ToolbarItemProps | string>;
};

export type GroupItemProps =
	| Array<
			| ToolbarItemProps
			| string
			| (Omit<CollapseProps, 'groups'> & {
					groups: Array<
						Omit<CollapseGroupProps, 'items'> & {
							items: Array<
								Omit<CollapseItemProps, 'engine'> | string
							>;
						}
					>;
			  })
	  >
	| GroupItemDataProps;

type GroupProps = Omit<GroupItemDataProps, 'items'> & {
	items: Array<ToolbarItemProps>;
};

export type ToolbarProps = {
	engine: EngineInterface;
	items: GroupItemProps[];
	className?: string;
	popup?: boolean;
};

const Toolbar: React.FC<ToolbarProps> = ({
	engine,
	className,
	popup,
	items = [],
}) => {
	const [data, setData] = useState<Array<GroupProps>>([]);
	//移动端浏览器视图信息
	const toolbarRef = useRef<HTMLDivElement | null>(null);
	const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const [mobileView, setMobileView] = useState({ top: 0 });
	const caluTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	//计算移动浏览器的视图变化
	const calcuMobileView = () => {
		if (!engine.isFocus() || engine.readonly) return;
		if (caluTimeoutRef.current) clearTimeout(caluTimeoutRef.current);
		caluTimeoutRef.current = setTimeout(() => {
			const element = toolbarRef.current!;
			const rect = element.getBoundingClientRect();
			const borderTop = removeUnit(
				getComputedStyle(element).borderTopWidth,
			);
			const borderBottom = removeUnit(
				getComputedStyle(element).borderBottomWidth,
			);
			const height = rect.height || 0;
			setMobileView({
				top:
					Math.max(
						document.body.scrollTop,
						document.documentElement.scrollTop,
					) +
					(window.visualViewport?.height || 0) -
					height +
					borderTop +
					borderBottom,
			});
		}, 20);
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
				let customItem:
					| ButtonProps
					| DropdownProps
					| ColorProps
					| CollapseProps
					| undefined = undefined;
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
					// 解析collapse item 为字符串时
					if (item.type === 'collapse') {
						const customCollapse: CollapseProps = {
							...merge(
								omit({ ...defaultItem }, 'groups'),
								omit({ ...item }, 'groups'),
							),
							groups: [],
						};
						item.groups.forEach((group) => {
							const items: Array<
								Omit<CollapseItemProps, 'engine'>
							> = [];
							group.items.forEach((cItem) => {
								let targetItem = undefined;
								(defaultItem as CollapseProps).groups.some(
									(g) =>
										g.items.some((i) => {
											const isEqual =
												i.name ===
												(typeof cItem === 'string'
													? cItem
													: cItem.name);
											if (isEqual) {
												targetItem = {
													...i,
													...(typeof cItem ===
													'string'
														? {}
														: cItem),
												};
											}
											return isEqual;
										}),
								);
								if (targetItem) items.push(targetItem);
								else if (typeof cItem === 'object')
									items.push(cItem);
							});
							if (items.length > 0) {
								customCollapse.groups.push({
									...omit(group, 'itmes'),
									items,
								});
							}
						});
						customItem =
							customCollapse.groups.length > 0
								? customCollapse
								: undefined;
					} else if (item.type === 'dropdown') {
						customItem = defaultItem
							? merge(
									defaultItem,
									omit({ ...item }, 'type', 'items'),
							  )
							: { ...item };
						(customItem as DropdownProps).items = item.items;
					} else {
						customItem = defaultItem
							? merge(defaultItem, omit({ ...item }, 'type'))
							: { ...item };
					}
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
							customItem.values = customItem.onActive(
								customItem.items,
							);
						else
							customItem.values = engine.command.queryState(
								customItem.name,
							);
					}
					if (customItem.type !== 'collapse')
						customItem.disabled = customItem.onDisabled
							? customItem.onDisabled()
							: !engine.command.queryEnabled(customItem.name);
					else {
						customItem.groups.forEach((group) =>
							group.items.forEach((item) => {
								item.disabled = item.onDisabled
									? item.onDisabled()
									: !engine.command.queryEnabled(item.name);
							}),
						);
					}
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

	const update = () => {
		if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
		updateTimeoutRef.current = setTimeout(() => {
			updateState();
		}, 100);
	};

	useEffect(() => {
		engine.language.add(locales);
		engine.on('select', update);
		engine.on('change', update);
		engine.on('blur', update);
		engine.on('focus', update);
		engine.on('historyChange', update);
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

		const handleReadonly = () => {
			if (engine.readonly) {
				hideMobileToolbar();
			} else {
				calcuMobileView();
			}
		};

		if (isMobile) {
			engine.on('readonly', handleReadonly);
			engine.on('blur', hideMobileToolbar);
			if (!engine.isFocus()) hideMobileToolbar();
			document.addEventListener('scroll', calcuMobileView);
			visualViewport.addEventListener('resize', calcuMobileView);
			visualViewport.addEventListener('scroll', calcuMobileView);
		} else {
			engine.on('readonly', update);
		}

		return () => {
			engine.off('select', update);
			engine.off('change', update);
			engine.off('blur', update);
			engine.off('focus', update);
			engine.off('historyChange', update);
			if (isMobile) {
				engine.off('readonly', handleReadonly);
				engine.off('blur', hideMobileToolbar);
				document.removeEventListener('scroll', calcuMobileView);
				visualViewport.removeEventListener('resize', calcuMobileView);
				visualViewport.removeEventListener('scroll', calcuMobileView);
			} else {
				engine.off('readonly', update);
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
				'editor-toolbar-mobile': isMobile && !popup,
				'editor-toolbar-popup': popup,
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
					<ToolbarGroup
						key={index}
						engine={engine}
						popup={popup}
						{...group}
					/>
				))}
			</div>
		</div>
	);
};

export default Toolbar;
export {
	fontFamilyDefaultData,
	fontfamily,
	getToolbarDefaultConfig as getDefaultConfig,
};
