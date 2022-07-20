import React, { useEffect, useRef, useState } from 'react';
import { LanguageInterface } from '@aomao/engine';
import Input, { InputRef } from 'antd/es/input';
import Button from 'antd/es/button';
import classnames from 'classnames-es-ts';
import 'antd/es/input/style';
import 'antd/es/button/style';

export type LinkEditorProps = {
	language: LanguageInterface;
	defaultText?: string;
	defaultLink?: string;
	className?: string;
	onLoad?: (element: InputRef) => void;
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

	const linkRef = useRef<InputRef>(null);

	useEffect(() => {
		linkRef.current?.focus();
		if (onLoad && linkRef.current) onLoad(linkRef.current);
	}, [linkRef]);

	return (
		<div
			data-element="ui"
			className={classnames('data-link-editor', className)}
		>
			<p>{language.get('link', 'text').toString()}</p>
			<p>
				<Input
					className="data-link-input"
					value={text}
					placeholder={language
						.get('link', 'text_placeholder')
						.toString()}
					onChange={(event) => {
						setText(event.target.value);
					}}
				/>
			</p>
			<p>{language.get('link', 'link').toString()}</p>
			<p>
				<Input
					ref={linkRef}
					className="data-link-input"
					value={link}
					placeholder={language
						.get('link', 'link_placeholder')
						.toString()}
					onChange={(event) => {
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
					{language.get('link', 'ok_button').toString()}
				</Button>
			</p>
		</div>
	);
};

export default LinkEditor;
