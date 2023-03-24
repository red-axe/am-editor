import ReactDOM from 'react-dom';
import React from 'react';
import Select from 'antd/es/select';
import 'antd/es/select/style/css';

type Options = {
	defaultValue?: string;
	container?: HTMLElement;
	onSelect?: (value: string) => void;
	modeDatas: { value: string; syntax: string; name: string }[];
};

const LanguageSelect: React.FC<Options> = ({
	defaultValue,
	container,
	onSelect,
	modeDatas,
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
			{modeDatas.map((item) => {
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
	modeDatas: { value: string; syntax: string; name: string }[],
	mode: string,
	onSelect?: (value: string) => void,
) => {
	ReactDOM.render(
		<LanguageSelect
			container={container}
			defaultValue={mode}
			onSelect={onSelect}
			modeDatas={modeDatas}
		/>,
		container,
	);
};
