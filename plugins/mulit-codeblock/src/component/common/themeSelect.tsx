import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { cmTheme } from '../utils/index';
import Select from 'antd/es/select';
import 'antd/es/select/style';

interface IThemeSelect {
	theme: string;
	onChange: (val?: string) => void;
}

function ThemeSelect({ theme, onChange }: IThemeSelect) {
	const [value, setValue] = useState(theme);

	const onChangehandler = (val?: string) => {
		setValue(val || '');
		onChange(val);
	};

	return (
		<Select
			size="small"
			value={value}
			placeholder="theme"
			style={{ width: '100px' }}
			onChange={onChangehandler}
			className="qz-mulitcode-theme"
		>
			<Select.Option value="default" name="default">
				default
			</Select.Option>
			{cmTheme.map((item: string) => (
				<Select.Option key={item} value={item} name={item}>
					{item}
				</Select.Option>
			))}
		</Select>
	);
}

interface ThemeFunProps {
	container: HTMLElement;
	theme: string;
	onChange: (val?: string) => void;
}

export default function renderThemeSelect(props: ThemeFunProps) {
	const { container, ...rest } = props;

	ReactDOM.render(<ThemeSelect {...rest} />, container);
}
