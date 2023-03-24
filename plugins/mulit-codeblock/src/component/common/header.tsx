import React from 'react';
import Dropdown from 'antd/es/dropdown';
import 'antd/es/dropdown/style/css';
import Tooltip from 'antd/es/tooltip';
import 'antd/es/tooltip/style/css';
import Menu from 'antd/es/menu';
import { MulitLangItem, MulitCodeProps } from '../type';
import { formateLangStyle } from '../utils/index';
import {
	DragDropContext,
	Droppable,
	Draggable,
	DropResult,
} from 'react-beautiful-dnd';
import cls from 'classnames';
import isUndefined from 'lodash/isUndefined';
import { isEngine } from '@aomao/engine';

interface IHeader {
	list: MulitLangItem[];
	current: MulitLangItem;
	initData: MulitCodeProps;
	refreshList: (val: MulitLangItem[]) => void;
	refreshCurrent: (lang: MulitLangItem) => void;
}

export default function Header({
	list,
	current,
	initData,
	refreshList,
	refreshCurrent,
}: IHeader) {
	const { options, value, editor } = initData;
	const isReadonly = !isEngine(editor) || editor.readonly;
	const local = editor.language.get('mulitCodeblock');
	const languagesConfig = value.language.map((lg) => lg.toLowerCase());
	const langConfigList = languagesConfig.filter(
		(item) => !list.map((lg) => lg.language).includes(item),
	);

	const addLanguage = (language: string) => {
		const newLang = { language, text: '' };
		const newList = list.concat(newLang);

		refreshList(newList);
		refreshCurrent(newLang);
		options?.onUpdateValue?.({ langs: newList });
	};

	const deleteLanguage = (lg: string) => {
		const newList = list.filter((item) => item.language !== lg);
		if (current.language === lg) {
			const [ls] = list;
			refreshCurrent(ls);
		}
		refreshList(newList);
		options?.onUpdateValue?.({ langs: newList });
	};

	const onDragEnd = (result: DropResult) => {
		const {
			destination: { index: end } = {},
			source: { index: start },
		} = result;

		if (!isUndefined(end)) {
			[list[start], list[end]] = [list[end], list[start]];
			refreshList(list);
			refreshCurrent(list[end]);
			options?.onUpdateValue?.({ langs: list });
		}
	};

	return (
		<div className="mulit-code-block-header">
			<DragDropContext onDragEnd={onDragEnd} onDragStart={() => false}>
				<Droppable
					droppableId="droppable-mulit-code-block"
					direction="horizontal"
				>
					{(provided) => (
						<div
							className="mulit-code-block-header-tool"
							ref={provided.innerRef}
							{...provided.droppableProps}
						>
							{list?.map((item, key) => (
								<Draggable
									key={item.language}
									draggableId={item.language}
									index={key}
									isDragDisabled={isReadonly}
								>
									{(provideded) => (
										<div
											ref={provideded.innerRef}
											{...provideded.draggableProps}
											{...provideded.dragHandleProps}
											className={cls(
												'mulit-code-block-header-item',
												{
													'mulit-code-block-header-item-active':
														current.language ===
														item.language,
													'mulit-code-block-header-item-read':
														isReadonly,
												},
											)}
											onClick={() => {
												refreshCurrent(item);
											}}
										>
											{formateLangStyle(item.language)}
											{!isReadonly && (
												<>
													{list && list.length > 1 && (
														<span
															className="data-icon data-icon-close mulit-code-block-header-item-close"
															onClick={(e) => {
																e.stopPropagation();
																deleteLanguage(
																	item.language,
																);
															}}
														/>
													)}
													<span className="data-icon data-icon-drag mulit-code-block-header-item-drag" />
												</>
											)}
										</div>
									)}
								</Draggable>
							))}
							{provided.placeholder}
						</div>
					)}
				</Droppable>
			</DragDropContext>

			{Boolean(langConfigList.length) && !isReadonly && (
				<Dropdown
					trigger={['click']}
					placement="bottom"
					overlayStyle={{ minWidth: '80px' }}
					overlay={
						<Menu
							items={langConfigList.map((lang, key) => ({
								key,
								label: (
									<div onClick={() => addLanguage(lang)}>
										{formateLangStyle(lang)}
									</div>
								),
							}))}
						/>
					}
				>
					<Tooltip title={local['add']} placement="right">
						<span className="data-icon data-icon-plus-circle-o mulit-code-block-header-item-add" />
					</Tooltip>
				</Dropdown>
			)}
		</div>
	);
}
