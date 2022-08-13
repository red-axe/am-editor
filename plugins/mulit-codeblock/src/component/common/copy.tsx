import React, { useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import Clipboard from 'clipboard';
import debounce from 'lodash/debounce';
import { Editor } from 'codemirror';
import { EditorInterface } from '@aomao/engine';

interface IProps {
	mirror: Editor | null;
	editor: EditorInterface;
}

export default function CopyIcon({ mirror, editor }: IProps) {
	const ref = useRef(null);
	const [isCopy, setIsCopy] = useState(false);
	const language = editor.language.get('mulitCodeblock');

	useEffect(() => {
		if (!mirror) return;

		const copy = new Clipboard(ref.current!, {
			text: () => mirror?.getValue?.() || language['copycontent'],
		});

		copy.on(
			'success',
			debounce(() => {
				setIsCopy(true);
				message.success(language['copysuccess']);
				setTimeout(() => {
					setIsCopy(false);
				}, 1000);
			}, 300),
		);

		copy.on('error', () => message.error(language['copyfail']));

		return () => copy.destroy();
	}, [mirror]);

	return (
		<div className="mulit-codeblock-copy" ref={ref}>
			{isCopy ? (
				<svg
					viewBox="0 0 1024 1024"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					p-id="21759"
					width="24"
					height="24"
				>
					<path
						d="M725.333333 870.4h-512c-66.030933 0-102.4-36.369067-102.4-102.4V256c0-66.030933 36.369067-102.4 102.4-102.4h512c66.030933 0 102.4 36.369067 102.4 102.4v512c0 66.030933-36.369067 102.4-102.4 102.4z m-512-682.666667c-47.223467 0-68.266667 21.0432-68.266666 68.266667v512c0 47.223467 21.0432 68.266667 68.266666 68.266667h512c47.223467 0 68.266667-21.0432 68.266667-68.266667V256c0-47.223467-21.0432-68.266667-68.266667-68.266667h-512z"
						p-id="21760"
						fill="#6abf40"
					/>
					<path
						d="M470.186667 716.8a33.962667 33.962667 0 0 1-24.132267-10.001067l-171.52-171.52a34.133333 34.133333 0 1 1 48.264533-48.264533l147.387734 147.387733 402.5344-402.5344a34.133333 34.133333 0 1 1 48.264533 48.264534l-426.666667 426.666666A33.962667 33.962667 0 0 1 470.186667 716.8z"
						p-id="21761"
						fill="#6abf40"
					/>
				</svg>
			) : (
				<svg
					viewBox="0 0 1024 1024"
					version="1.1"
					xmlns="http://www.w3.org/2000/svg"
					p-id="20676"
					width="24"
					height="24"
				>
					<path
						d="M780.6 127.2H354.4c-63 0-113.8 50.7-113.8 113.8v426.2c0 63 50.7 113.8 113.8 113.8h426.2c63 0 113.8-50.7 113.8-113.8V241c0-63-50.7-113.8-113.8-113.8z m52.4 537c0 29.7-24.3 55.4-55.4 55.4H357.4c-29.7 0-55.4-24.3-55.4-55.4V244c0-29.7 24.3-55.4 55.4-55.4h420.2c29.7 0 55.4 24.3 55.4 55.4v420.2z"
						p-id="20677"
					/>
					<path
						d="M155.6 279.3c-15.2 0-27 11.8-28.6 25.5v473.5c3.6 65.2 57 116.3 123.1 116.3h464.6c15.1 0 27.4-12.3 28.8-27.4 0-16.4-13.7-28.8-28.8-28.8l-463.1 0.1c-37 0-67.2-30.2-67.2-67.2V308.1c0-16.4-13.7-28.8-28.8-28.8z"
						p-id="20678"
					/>
				</svg>
			)}
		</div>
	);
}
