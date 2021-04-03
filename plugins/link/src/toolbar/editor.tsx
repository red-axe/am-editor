import React, { useEffect, useRef, useState } from 'react';
import { Input, Button } from 'antd';
import classnames from 'classnames-es-ts';
import 'antd/lib/input/style';
import 'antd/lib/button/style';
import { LanguageInterface } from '@aomao/engine';

export type LinkEditorProps = {
	language: LanguageInterface;
	defaultText?: string;
	defaultLink?: string;
	className?: string;
	onLoad?: () => void;
	onOk: (text: string, link: string) => void;
};

const LinkEditor: React.FC<LinkEditorProps> = ({
	language,
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
			<p>{language.get('link', 'text')}</p>
			<p>
				<Input
					className="data-link-input"
					value={text}
					placeholder={language
						.get('link', 'text_placeholder')
						.toString()}
					onChange={event => {
						setText(event.target.value);
					}}
				/>
			</p>
			<p>{language.get('link', 'link')}</p>
			<p>
				<Input
					ref={linkRef}
					className="data-link-input"
					value={link}
					placeholder={language
						.get('link', 'link_placeholder')
						.toString()}
					onChange={event => {
						setLink(event.target.value);
					}}
				/>
			</p>
			<p>
				<Button
					className="data-link-button"
					onClick={() => onOk(text, link)}
					disabled={link.trim() === ''}
				>
					{language.get('link', 'ok_button')}
				</Button>
			</p>
		</div>
	);
};

export default LinkEditor;
