import React, { useMemo, useState } from 'react';
import { TagValue, IType } from './type';
import Popover from 'antd/es/popover/index';
import 'antd/es/popover/style';
import Input from 'antd/es/input/index';
import 'antd/es/input/style';
import uniqBy from 'lodash/uniqBy';
import { EditorInterface } from '@aomao/engine';

interface ValueItem {
	type: IType;
	background: string;
	color: string;
	text: string;
}

type TagVauleItem = ValueItem & { isCustom: boolean };
interface IProps {
	value: TagValue;
	editor: EditorInterface;
	defaultVisible?: boolean;
	onChange?: (item: TagVauleItem) => void;
}

export const defaultValue: ValueItem[] = [
	{
		type: 'abandon',
		background: '#FFE8E6',
		color: '#820014',
		text: '废弃',
	},
	{
		type: 'must',
		background: '#ebf3ff',
		color: '#338aff',
		text: '必填',
	},
	{
		type: 'add',
		background: '#d8eecd',
		color: '#5ca537',
		text: '新增',
	},
	{
		type: 'delete',
		background: '#ffe9bc',
		color: '#dc9300',
		text: '删除',
	},
];

const getInitData = (
	list: ValueItem[],
	value: TagValue,
	local: Record<string, any>,
) => {
	const { tagType, tagValue, isCustom } = value;
	const data = list.find((item) => item.type === tagType) || list[0];

	if (isCustom) {
		return {
			...data,
			text: tagValue || local['addTag'],
			isCustom: true,
		};
	}

	return {
		...data,
		text: tagType ? data.type : local['addTag'],
		isCustom: false,
	};
};

const storageKey = 'tag-plugin-list';

const getTagList = () => {
	try {
		const list = JSON.parse(localStorage.getItem(storageKey) || '[]');
		return Array.isArray(list) ? list : [];
	} catch (err) {
		return [];
	}
};

export default function Tag({
	value,
	editor,
	onChange,
	defaultVisible = false,
}: IProps) {
	const { tagType, tagValue, isCustom } = value;
	const local = editor.language.get<{}>('tag');
	const initData = useMemo(() => {
		return defaultValue.map((item) => ({
			...item,
			text: local[item.type],
		}));
	}, []);
	const data = getInitData(initData, value, local);
	const description = isCustom ? tagValue : '';
	const historyList = getTagList();

	const [history, setHistory] = useState<TagVauleItem[]>(historyList);
	const [type, setType] = useState(tagType);
	const [activeValue, setActiveValue] = useState(data);
	const [customText, setCustomText] = useState(description);
	const [visible, setVisible] = useState(defaultVisible);

	const hide = () => {
		setVisible(false);
	};

	const handleVisibleChange = (newVisible: boolean) => {
		setVisible(newVisible);
	};

	const onClick = (item: ValueItem) => {
		setType(item.type);
		setCustomText('');
		setActiveValue({
			...item,
			isCustom: false,
		});

		if (onChange) {
			onChange({
				...item,
				isCustom: false,
			});
			hide();
		}
	};

	const setTagHistory = (item: ValueItem) => {
		const list = [
			{
				...item,
				isCustom: true,
			},
			...history,
		];
		const uniqList = uniqBy(list, 'text').slice(0, 3);

		setHistory(uniqList);
		localStorage.setItem(storageKey, JSON.stringify(uniqList));
	};

	const onCustomClick = (item: ValueItem) => {
		if (customText) {
			setTagHistory({
				...item,
				text: customText,
			});
		}

		setType(item.type);
		setActiveValue({
			...item,
			text: customText,
			isCustom: true,
		});

		if (onChange) {
			onChange({
				...item,
				text: customText,
				isCustom: true,
			});
		}
	};

	const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCustomText(e.target.value);
		setActiveValue({
			...activeValue,
			isCustom: true,
		});
	};

	const onPressEnter = () => {
		if (customText) {
			setTagHistory({
				...activeValue,
				text: customText,
			});
		}

		setType(activeValue.type || 'abandon');
		setActiveValue({
			...activeValue,
			text: customText,
		});

		if (onChange) {
			onChange({
				...activeValue,
				text: customText,
			});
			hide();
		}
	};

	const onHistoryClick = (item: ValueItem) => {
		setTagHistory(item);
		setCustomText('');
		setType('');
		setActiveValue({
			...item,
			isCustom: true,
		});

		if (onChange) {
			onChange({
				...item,
				isCustom: true,
			});
			hide();
		}
	};

	return (
		<Popover
			showArrow={false}
			visible={visible}
			trigger={['click']}
			placement="bottomLeft"
			overlayClassName="tag-plugin-tooltip"
			onVisibleChange={handleVisibleChange}
			overlayStyle={{
				padding: 0,
				boxShadow: '0px 2px 4px 0px rgba(225 225 225, .5)',
			}}
			content={
				<div className="tag-plugin-tooltip-contain">
					<div className="tag-plugin-tooltip-default">
						<div className="tag-plugin-tooltip-title">
							{local['defaultTag']}
						</div>
						{initData.map((item) => (
							<span
								key={item.type}
								style={{
									minWidth: 22,
									color: item.color,
									background: item.background,
								}}
								onClick={() => {
									onClick(item);
								}}
							>
								{type === item.type && !activeValue.isCustom && (
									<svg
										width={12}
										height={12}
										fill={item.color}
										viewBox="0 0 18 18"
										style={{ marginRight: 2 }}
									>
										<path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
									</svg>
								)}
								{item.text}
							</span>
						))}
					</div>
					<div className="tag-plugin-tooltip-custom">
						<div className="tag-plugin-tooltip-title">
							{local['customTag']}
						</div>
						<div className="tag-plugin-tooltip-custom-theme">
							{initData.map((item) => (
								<span
									key={item.type}
									style={{
										color: item.color,
										background: item.background,
									}}
									onClick={() => {
										onCustomClick(item);
									}}
								>
									{type === item.type &&
										activeValue.isCustom && (
											<svg
												width={12}
												height={12}
												fill={item.color}
												viewBox="0 0 18 18"
												style={{ marginRight: 2 }}
											>
												<path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
											</svg>
										)}
								</span>
							))}
						</div>
						<Input
							size="small"
							value={customText}
							placeholder={local['placeholder']}
							onChange={onInputChange}
							onPressEnter={onPressEnter}
						/>
						<div className="tag-plugin-tooltip-custom-history">
							{Boolean(history.length) && (
								<div className="tag-plugin-tooltip-custom-history-title">
									{local['historyTag']}
								</div>
							)}
							{history.map((item: ValueItem, index) => (
								<span
									key={index}
									style={{
										color: item.color,
										background: item.background,
										border: `0 solid ${item.color}`,
									}}
									className={
										activeValue.type === item.type &&
										activeValue.text &&
										activeValue.isCustom &&
										activeValue.text === item.text
											? 'tag-plugin-tooltip-custom-history-active'
											: ''
									}
									onClick={() => {
										onHistoryClick(item);
									}}
								>
									{item.text}
								</span>
							))}
						</div>
					</div>
				</div>
			}
		>
			<div
				className="tag-plugin-contain"
				style={{
					color: activeValue.color,
					background: activeValue.background,
				}}
			>
				{activeValue.text || local['addTag']}
			</div>
		</Popover>
	);
}
