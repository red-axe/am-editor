import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import { Select } from 'antd';
import modeData from './mode';
import 'antd/lib/select/style';

type Options = {
	defaultValue?: string;
	container?: HTMLElement;
	onSelect?: (value: string) => void;
};

const LanguageSelect: React.FC<Options> = ({
	defaultValue,
	container,
	onSelect,
}) => {
	const filter = (input: string, option: any) => {
		input = input.toLowerCase();
		const key = option.key || '';
		let name = option.name || '';
		name = name.toLowerCase();
		return key.includes(input) || name.includes(input);
	};

	return (
		<Select
			showSearch={true}
			size="small"
			bordered={false}
			style={{
				minWidth: 128,
			}}
			defaultValue={defaultValue}
			getPopupContainer={container ? () => container : undefined}
			onSelect={onSelect}
			filterOption={filter}
		>
			{modeData.map(item => {
				return (
					<Select.Option
						name={item.name}
						value={item.value}
						key={item.value}
					>
						{item.name}
					</Select.Option>
				);
			})}
		</Select>
	);
};

export { LanguageSelect };

export default (
	container: HTMLElement,
	mode: string,
	onSelect?: (value: string) => void,
) => {
	ReactDOM.render(
		<LanguageSelect
			container={container}
			defaultValue={mode}
			onSelect={onSelect}
		/>,
		container,
	);
};
