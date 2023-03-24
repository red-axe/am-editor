import React, { useState, useContext } from 'react';
import Input from 'antd/es/input';
import Button from 'antd/es/button';
import Contentx from '../../context';
import 'antd/es/input/style/css';
import 'antd/es/button/style/css';

type EditProps = {
	defaultValue?: string;
	loading?: boolean;
	onChange?: (value: string) => void;
	onCancel: (event: React.MouseEvent) => void;
	onOk: (event: React.MouseEvent) => void;
};

const CommentEdit: React.FC<EditProps> = ({
	defaultValue,
	onChange,
	onCancel,
	onOk,
	loading,
}) => {
	const [value, setValue] = useState(defaultValue || '');

	const { lang } = useContext(Contentx);

	return (
		<div className="doc-comment-edit-wrapper">
			<div className="doc-comment-edit-input">
				<Input
					value={value}
					onChange={(e) => {
						const value = e.target.value;
						setValue(value);
						if (onChange) onChange(value);
					}}
				/>
			</div>
			<div className="doc-comment-edit-button">
				<Button size="small" onClick={onCancel}>
					{lang === 'zh-CN' ? '取消' : 'Cancel'}
				</Button>
				<Button
					size="small"
					type="primary"
					onClick={(event) => {
						setValue('');
						onOk(event);
					}}
					loading={loading}
				>
					{lang === 'zh-CN' ? '确定' : 'Ok'}
				</Button>
			</div>
		</div>
	);
};

export default CommentEdit;
