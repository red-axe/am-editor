import React, { useEffect, useRef, useState } from 'react';
import { Input, Button } from 'antd';
import classnames from 'classnames';
import 'antd/lib/input/style';
import 'antd/lib/button/style';

export type LinkEditorProps = {
	defaultText?: string;
	defaultLink?: string;
	className?: string;
	onLoad?: () => void;
	onOk: (text: string, link: string) => void;
};

const LinkEditor: React.FC<LinkEditorProps> = ({
	defaultLink,
	defaultText,
	className,
	onLoad,
	onOk,
}) => {
	const [text, setText] = useState(defaultText || '');
	const [link, setLink] = useState(defaultLink || '');

	const linkRef = useRef<Input>(null);

	useEffect(() => {
		if (onLoad) onLoad();
		linkRef.current?.focus();
	}, []);

	return (
		<div className={classnames('data-link-editor', className)}>
			<p>文本</p>
			<p>
				<Input
					className="data-link-input"
					value={text}
					placeholder="添加描述"
					onChange={event => {
						setText(event.target.value);
					}}
				/>
			</p>
			<p>链接</p>
			<p>
				<Input
					ref={linkRef}
					className="data-link-input"
					value={link}
					placeholder="链接地址"
					onChange={event => {
						setLink(event.target.value);
					}}
					onPressEnter={() => {
						if (link.trim() === '' && text.trim() === '') return;
						onOk(text, link);
					}}
				/>
			</p>
			<p>
				<Button
					className="data-link-button"
					onClick={() => onOk(text, link)}
					disabled={link.trim() === '' && text.trim() === ''}
				>
					确定
				</Button>
			</p>
		</div>
	);
};

export default LinkEditor;
