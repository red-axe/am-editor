import React from 'react';
import { EngineInterface } from '@aomao/engine';
import {
	ButtonProps,
	DropdownProps,
	ColorProps,
	CollapseProps,
} from '../../types';
import TableSelector from '../../table';
import './index.css';

export const getToolbarDefaultConfig = (
	engine: EngineInterface,
): Array<ButtonProps | DropdownProps | ColorProps | CollapseProps> => {
	const language = engine.language.get('toolbar');
	return [
		{
			type: 'collapse',
			header: language['collapse']['title'],
			icon: 'collapse',
			groups: [
				{
					items: [
						{
							name: 'image-uploader',
							icon: (
								<span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
									>
										<g fill="none" fillRule="evenodd">
											<rect
												stroke="#E8E8E8"
												strokeWidth=".667"
												fill="#FFF"
												x=".333"
												y=".333"
												width="23.333"
												height="23.333"
												rx="1.333"
											/>
											<g fillRule="nonzero">
												<path
													d="M8.625 8a1.126 1.126 0 010 2.25 1.126 1.126 0 010-2.25z"
													fill="#FFD666"
												/>
												<path
													d="M17.95 14.88a.144.144 0 01-.092.033H6.14a.139.139 0 01-.14-.137.14.14 0 01.033-.089l2.981-3.45a.143.143 0 01.198-.018c.005.005.012.01.017.017l1.74 2.016 2.767-3.203a.143.143 0 01.198-.017l.018.017 4.018 4.64a.137.137 0 01-.02.191z"
													fill="#CCC"
												/>
												<path
													d="M17.91 14.88a.144.144 0 01-.092.033H9.333l4.363-4.864a.143.143 0 01.198-.017l.018.017 4.018 4.64a.137.137 0 01-.02.191z"
													fill="#737373"
												/>
											</g>
										</g>
									</svg>
								</span>
							),
							title: '图片',
							search: '图片,tupian,image,img',
						},
						{
							name: 'codeblock',
							icon: (
								<span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
									>
										<g fill="none" fillRule="evenodd">
											<rect
												stroke="#E8E8E8"
												fill="#FFF"
												x=".5"
												y=".5"
												width="23"
												height="23"
												rx="2"
											/>
											<path
												d="M19.331 11.815c-.407-.22-.665-.678-.665-1.181V8.062c0-.202-.148-.367-.33-.367h-.933a.153.153 0 01-.153-.153v-.64c0-.084.068-.152.153-.152h.933c.651 0 1.18.588 1.18 1.312v2.572c0 .14.072.269.186.33l.843.455c.05.026.08.078.08.134v.894c0 .056-.03.108-.08.134l-.843.455a.373.373 0 00-.186.33v2.572c0 .724-.529 1.312-1.18 1.312h-.933a.153.153 0 01-.153-.153v-.64c0-.084.068-.152.153-.152h.933c.182 0 .33-.165.33-.367v-2.572c0-.503.258-.961.665-1.18l.344-.186-.344-.185zM5.044 11.815c.407-.22.665-.678.665-1.181V8.062c0-.202.148-.367.33-.367h.933a.153.153 0 00.153-.153v-.64a.153.153 0 00-.153-.152H6.04c-.651 0-1.18.588-1.18 1.312v2.572c0 .14-.072.269-.186.33l-.843.455a.153.153 0 00-.08.134v.894c0 .056.03.108.08.134l.843.455c.114.061.186.19.186.33v2.572c0 .724.529 1.312 1.18 1.312h.933a.153.153 0 00.153-.153v-.64a.153.153 0 00-.153-.152H6.04c-.182 0-.33-.165-.33-.367v-2.572c0-.503-.258-.961-.665-1.18L4.7 12l.344-.185z"
												fill="#595959"
												fillRule="nonzero"
											/>
											<path
												fill="#1890FF"
												opacity=".25"
												d="M8.25 8.25h7.5v1.125h-7.5z"
											/>
											<path
												fill="#D2E8DB"
												d="M8.25 10.5h4.5v1.125h-4.5z"
											/>
											<path
												fill="#E0E0E0"
												d="M8.25 12.75h4.5v1.125h-4.5zM8.25 15h6v1.125h-6z"
											/>
										</g>
									</svg>
								</span>
							),
							title: '代码块',
							search: '代码块,daimakuai,code',
						},
						{
							name: 'table',
							command: { name: 'table', args: [3, 3] },
							placement: 'rightTop',
							prompt: (
								<TableSelector
									onSelect={(event, rows, cols) => {
										event.preventDefault();
										event.stopPropagation();
										engine.command.execute(
											'table',
											rows,
											cols,
										);
									}}
								/>
							),
							icon: (
								<svg
									width="24px"
									height="24px"
									viewBox="0 0 24 24"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
								>
									<g
										stroke="none"
										strokeWidth="1"
										fill="none"
										fillRule="evenodd"
									>
										<g transform="translate(-16.000000, -93.000000)">
											<g>
												<g transform="translate(16.000000, 53.000000)">
													<g transform="translate(0.000000, 40.000000)">
														<g>
															<rect
																stroke="#E8E8E8"
																strokeWidth="0.666666667"
																fill="#FFFFFF"
																x="0.333333333"
																y="0.333333333"
																width="23.3333333"
																height="23.3333333"
																rx="1.33333333"
															></rect>
															<g transform="translate(5.250000, 6.750000)">
																<path
																	d="M0.75,0 L3.75,0 L3.75,10.5 L0.75,10.5 C0.335786438,10.5 5.07265313e-17,10.1642136 0,9.75 L0,0.75 C-5.07265313e-17,0.335786438 0.335786438,7.6089797e-17 0.75,0 Z"
																	id="Rectangle"
																	fill="#F0F0F0"
																></path>
																<path
																	d="M0.25,2.75 L13.25,2.75 L13.25,0.75 C13.25,0.473857625 13.0261424,0.25 12.75,0.25 L0.75,0.25 C0.473857625,0.25 0.25,0.473857625 0.25,0.75 L0.25,2.75 Z"
																	id="Rectangle"
																	stroke="#595959"
																	strokeWidth="0.5"
																	fillOpacity="0.15"
																	fill="#25B864"
																></path>
																<rect
																	id="Rectangle"
																	fill="#E8E8E8"
																	x="0"
																	y="5.25"
																	width="13.5"
																	height="1"
																></rect>
																<rect
																	id="Rectangle-Copy"
																	fill="#E8E8E8"
																	x="0"
																	y="7.5"
																	width="13.5"
																	height="1"
																></rect>
																<rect
																	id="Rectangle"
																	fill="#E8E8E8"
																	x="6.75"
																	y="0"
																	width="1"
																	height="10.5"
																></rect>
																<rect
																	id="Rectangle-Copy-5"
																	fill="#E8E8E8"
																	x="9.75"
																	y="0"
																	width="1"
																	height="10.5"
																></rect>
																<rect
																	id="Rectangle"
																	stroke="#737373"
																	strokeWidth="0.75"
																	x="0.375"
																	y="0.375"
																	width="12.75"
																	height="9.75"
																	rx="0.75"
																></rect>
																<path
																	d="M3.5,10.25 L3.5,0.25 L0.75,0.25 C0.473857625,0.25 0.25,0.473857625 0.25,0.75 L0.25,9.75 C0.25,10.0261424 0.473857625,10.25 0.75,10.25 L3.5,10.25 Z"
																	id="Rectangle"
																	stroke="#737373"
																	strokeWidth="0.5"
																></path>
																<path
																	d="M0.25,2.75 L13.25,2.75 L13.25,0.75 C13.25,0.473857625 13.0261424,0.25 12.75,0.25 L0.75,0.25 C0.473857625,0.25 0.25,0.473857625 0.25,0.75 L0.25,2.75 Z"
																	id="Rectangle"
																	stroke="#737373"
																	strokeWidth="0.5"
																></path>
															</g>
														</g>
													</g>
												</g>
											</g>
										</g>
									</g>
								</svg>
							),
							title: '表格',
							search: 'biaoge,table',
						},
					],
				},
			],
		},
		{
			type: 'button',
			name: 'undo',
			icon: 'undo',
			title: language['undo']['title'],
			onDisabled: () => {
				return !engine.command.queryState('undo');
			},
			onActive: () => false,
		},
		{
			type: 'button',
			name: 'redo',
			icon: 'redo',
			title: language['redo']['title'],
			onDisabled: () => {
				return !engine.command.queryState('redo');
			},
			onActive: () => false,
		},
		{
			type: 'button',
			name: 'paintformat',
			icon: 'paintformat',
			title: language['paintformat']['title'],
		},
		{
			type: 'button',
			name: 'removeformat',
			icon: 'clean',
			title: language['removeformat']['title'],
		},
		{
			type: 'dropdown',
			name: 'heading',
			className: 'toolbar-dropdown-heading',
			title: language['heading']['title'],
			items: [
				{
					key: 'p',
					className: 'heading-item-p',
					content: language['heading']['p'],
				},
				{
					key: 'h1',
					className: 'heading-item-h1',
					content: language['heading']['h1'],
				},
				{
					key: 'h2',
					className: 'heading-item-h2',
					content: language['heading']['h2'],
				},
				{
					key: 'h3',
					className: 'heading-item-h3',
					content: language['heading']['h3'],
				},
				{
					key: 'h4',
					className: 'heading-item-h4',
					content: language['heading']['h4'],
				},
				{
					key: 'h5',
					className: 'heading-item-h5',
					content: language['heading']['h5'],
				},
				{
					key: 'h6',
					className: 'heading-item-h6',
					content: language['heading']['h6'],
				},
			],
		},
		{
			type: 'dropdown',
			name: 'fontsize',
			className: 'toolbar-dropdown-fontsize',
			title: language['fontsize']['title'],
			items: [
				{ key: '12px', content: '12px', hotkey: false },
				{ key: '13px', content: '13px', hotkey: false },
				{
					key: '14px',
					content: '14px',
					isDefault: true,
					hotkey: false,
				},
				{ key: '15px', content: '15px', hotkey: false },
				{ key: '16px', content: '16px', hotkey: false },
				{ key: '19px', content: '19px', hotkey: false },
				{ key: '22px', content: '22px', hotkey: false },
				{ key: '24px', content: '24px', hotkey: false },
				{ key: '29px', content: '29px', hotkey: false },
				{ key: '32px', content: '32px', hotkey: false },
				{ key: '40px', content: '40px', hotkey: false },
				{ key: '48px', content: '48px', hotkey: false },
			],
			onDisabled: () => {
				const tag = engine.command.queryState('heading') || 'p';
				return /^h\d$/.test(tag);
			},
		},
		{
			type: 'button',
			name: 'bold',
			icon: 'bold',
			title: language['bold']['title'],
			onDisabled: () => {
				const tag = engine.command.queryState('heading') || 'p';
				return /^h\d$/.test(tag);
			},
		},
		{
			type: 'button',
			name: 'italic',
			icon: 'italic',
			title: language['italic']['title'],
		},
		{
			type: 'button',
			name: 'strikethrough',
			icon: 'strikethrough',
			title: language['strikethrough']['title'],
		},
		{
			type: 'button',
			name: 'underline',
			icon: 'underline',
			title: language['underline']['title'],
		},
		{
			type: 'dropdown',
			name: 'moremark',
			icon: 'moremark',
			single: false,
			title: language['moremark']['title'],
			items: [
				{
					key: 'sup',
					icon: 'sup',
					content: language['moremark']['sup'],
					command: { name: 'sup', args: [] },
				},
				{
					key: 'sub',
					icon: 'sub',
					content: language['moremark']['sub'],
					command: { name: 'sub', args: [] },
				},
				{
					key: 'code',
					icon: 'code',
					content: language['moremark']['code'],
					command: { name: 'code', args: [] },
				},
			],
			onActive: () => {
				const plugins = [];
				if (engine.command.queryState('sup') === true)
					plugins.push('sup');
				if (engine.command.queryState('sub') === true)
					plugins.push('sub');
				if (engine.command.queryState('code') === true)
					plugins.push('code');
				return plugins;
			},
		},
		{
			type: 'color',
			name: 'fontcolor',
			defaultColor: '#262626',
			defaultActiveColor: '#F5222D',
			buttonTitle: language['fontcolor']['title'],
			dropdownTitle: language['fontcolor']['more'],
			content: (color: string, stroke: string, disabled?: boolean) => {
				if (disabled === true) {
					color = '#BFBFBF';
					stroke = '#BFBFBF';
				}
				return (
					<svg
						width="16px"
						height="16px"
						viewBox="0 0 16 16"
						style={{ marginBottom: -2 }}
					>
						<title>color-font</title>
						<desc>Created with Sketch.</desc>
						<g
							id="color-font"
							stroke="none"
							strokeWidth="1"
							fill="none"
							fillRule="evenodd"
						>
							<rect
								id="Rectangle-55"
								stroke={stroke}
								strokeWidth="0.5"
								fill={color}
								x="2"
								y="12.75"
								width="12"
								height="1.5"
								rx="0.125"
							/>
							<path
								d="M5.29102819,11.25 L3.96365715,11.25 C3.87952002,11.25 3.8113134,11.1817934 3.8113134,11.0976562 C3.8113134,11.08076 3.81412419,11.0639814 3.81963067,11.0480076 L7.0756112,1.60269506 C7.09679504,1.5412426 7.15463644,1.5 7.21963767,1.5 L8.81868806,1.5 C8.883726,1.5 8.94159158,1.54128846 8.96274706,1.60278951 L12.2118,11.048102 C12.239168,11.1276636 12.1968568,11.2143472 12.1172952,11.2417152 C12.1013495,11.2472004 12.0846037,11.25 12.067741,11.25 L10.6761419,11.25 C10.6099165,11.25 10.5512771,11.2072154 10.531066,11.1441494 L9.69970662,8.55 L6.27433466,8.55 L5.43599205,11.1444975 C5.41567115,11.2073865 5.35711879,11.25 5.29102819,11.25 Z M8.02635163,3.18571429 L7.96199183,3.18571429 L6.63904023,7.30714286 L9.33500105,7.30714286 L8.02635163,3.18571429 Z"
								id="A"
								fill="#595959"
							/>
						</g>
					</svg>
				);
			},
		},
		{
			type: 'color',
			name: 'backcolor',
			defaultColor: 'transparent',
			defaultActiveColor: '#FADB14',
			buttonTitle: language['backcolor']['title'],
			dropdownTitle: language['backcolor']['more'],
			content: (color: string, stroke: string, disabled?: boolean) => {
				if (disabled === true) {
					color = '#BFBFBF';
					stroke = '#BFBFBF';
				}
				return (
					<svg
						width="16px"
						height="16px"
						viewBox="0 0 16 16"
						style={{ marginBottom: -2 }}
					>
						<title>color-bg</title>
						<desc>Created with Sketch.</desc>
						<g
							id="color-bg"
							stroke="none"
							strokeWidth="1"
							fill="none"
							fillRule="evenodd"
						>
							<path
								d="M11.9745711,7.921875 C11.9745711,7.921875 13.2147672,9.2863447 13.2147672,10.1226326 C13.2147672,10.8142992 12.6566789,11.3802083 11.9745711,11.3802083 C11.2924632,11.3802083 10.734375,10.8142992 10.734375,10.1226326 C10.734375,9.2863447 11.9745711,7.921875 11.9745711,7.921875 Z M9.07958999,6.47535893 L6.28501575,3.68078468 L3.4904415,6.47535893 L9.07958999,6.47535893 Z M5.3326566,3.04215357 L4.28223263,1.9917296 C4.22692962,1.93642659 4.22692962,1.84676271 4.28223263,1.7914597 L5.03228902,1.0414033 C5.08759203,0.986100299 5.17725591,0.986100299 5.23255892,1.0414033 L6.4546098,2.26345418 C6.46530408,2.27146914 6.4755605,2.28033918 6.48528564,2.29006432 L10.4848531,6.28963174 C10.5954591,6.40023775 10.5954591,6.57956552 10.4848531,6.69017153 L6.4838816,10.691143 C6.37327559,10.801749 6.19394782,10.801749 6.08334181,10.691143 L2.08377439,6.69157557 C1.97316838,6.58096956 1.97316838,6.40164179 2.08377439,6.29103578 L5.3326566,3.04215357 Z"
								id="Combined-Shape"
								fill="#595959"
							/>
							<rect
								id="Rectangle-55"
								stroke={stroke}
								strokeWidth="0.5"
								fill={color}
								x="2"
								y="12.75"
								width="12"
								height="1.5"
								rx="0.125"
							/>
						</g>
					</svg>
				);
			},
		},
		{
			type: 'dropdown',
			name: 'alignment',
			title: language['alignment']['title'],
			items: [
				{
					key: 'left',
					icon: 'align-left',
					content: language['alignment']['left'],
				},
				{
					key: 'center',
					icon: 'align-center',
					content: language['alignment']['center'],
				},
				{
					key: 'right',
					icon: 'align-right',
					content: language['alignment']['right'],
				},
				{
					key: 'justify',
					icon: 'align-justify',
					content: language['alignment']['justify'],
				},
			],
		},
		{
			type: 'button',
			name: 'unorderedlist',
			icon: 'unordered-list',
			title: language['unorderedlist']['title'],
		},
		{
			type: 'button',
			name: 'orderedlist',
			icon: 'ordered-list',
			title: language['orderedlist']['title'],
		},
		{
			type: 'button',
			name: 'tasklist',
			icon: 'task-list',
			title: language['tasklist']['title'],
		},
		{
			type: 'dropdown',
			name: 'indent',
			icon: 'indent',
			hasDot: false,
			title: language['indent']['title'],
			items: [
				{
					key: 'in',
					icon: 'indent',
					content: language['indent']['in'],
				},
				{
					key: 'out',
					icon: 'outdent',
					content: language['indent']['out'],
				},
			],
		},
		{
			type: 'button',
			name: 'link',
			icon: 'link',
			command: { name: 'link', args: ['_blank'] },
			title: language['link']['title'],
		},
		{
			type: 'button',
			name: 'quote',
			icon: 'quote',
			title: language['quote']['title'],
		},
		{
			type: 'button',
			name: 'hr',
			icon: 'hr',
			title: language['hr']['title'],
		},
	];
};
