import { h } from 'vue';
import { CARD_SELECTOR, EngineInterface, isEngine, Range } from '@aomao/engine';
import { ToolbarItemProps } from '../types';
import TableSelector from '../components/table.vue';
import fontfamily, { defaultData as fontFamilyDefaultData } from './fontfamily';
import './index.css';

export { fontfamily, fontFamilyDefaultData };

export const getToolbarDefaultConfig = (
	engine: EngineInterface,
): Array<ToolbarItemProps> => {
	const language = engine.language.get<{
		[key: string]: { [key: string]: string };
	}>('toolbar');
	const fontSizeInContainer = engine.container.css('font-size');
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
							icon: `<span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
									>
										<g fill="none" fill-rule="evenodd">
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
											<g fill-rule="nonzero">
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
								</span>`,
							title: language['image']['title'],
							search: '图片,tupian,image,img',
						},
						{
							name: 'codeblock',
							icon: `<span>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
									>
										<g fill="none" fill-rule="evenodd">
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
												fill-rule="nonzero"
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
								</span>`,
							title: language['codeblock']['title'],
							search: '代码块,daimakuai,code',
						},
						{
							name: 'table',
							command: { name: 'table', args: [3, 3] },
							placement: 'rightTop',
							onDisabled: () => {
								// 有激活卡片 或者没有启用插件
								return (
									!!engine.card.active ||
									!engine.command.queryEnabled('table')
								);
							},
							prompt:
								!!engine.card.active ||
								!engine.command.queryEnabled('table')
									? undefined
									: h(TableSelector, {
											onSelect: (
												event: MouseEvent,
												rows: number,
												cols: number,
											) => {
												engine.command.execute(
													'table',
													rows,
													cols,
												);
											},
									  }),
							icon: `<span><svg
									width="24px"
									height="24px"
									view-box="0 0 24 24"
									version="1.1"
									xmlns="http://www.w3.org/2000/svg"
								>
									<g
										stroke="none"
										strokeWidth="1"
										fill="none"
										fill-rule="evenodd"
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
																	fill-opacity="0.15"
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
								</svg></span>`,
							title: language['table']['title'],
							search: 'biaoge,table',
						},
						{
							name: 'file-uploader',
							icon: `<span>
									<svg
										width="24"
										height="24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<g fill="none" fill-rule="evenodd">
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
												fill="#E0E0E0"
												d="M11.25 15h8.25v1.125h-8.25zM14.25 11.25h5.25v1.125h-5.25zM14.25 8.25h5.25v1.125h-5.25z"
											/>
											<path
												d="M11.216 8.324a2.593 2.593 0 00-3.791 0l-2.896 3.04a.108.108 0 00-.029.074c0 .028.01.055.029.075l.41.43c.038.041.101.041.14 0l2.896-3.04a1.841 1.841 0 012.69 0c.36.378.557.88.557 1.413 0 .534-.197 1.035-.557 1.413l-2.95 3.1-.48.502c-.446.47-1.173.47-1.62 0a1.226 1.226 0 01-.335-.851c0-.322.119-.624.335-.851l2.928-3.075a.382.382 0 01.276-.12h.001c.105 0 .201.043.274.12.075.078.115.18.115.29a.416.416 0 01-.115.288l-2.393 2.512a.108.108 0 00-.029.075c0 .028.01.054.03.074l.409.43c.038.041.102.041.14 0l2.392-2.513c.221-.232.342-.54.342-.867 0-.328-.122-.637-.342-.868a1.131 1.131 0 00-1.653 0l-.284.3-2.642 2.776a2.06 2.06 0 00-.564 1.43c0 .54.2 1.047.564 1.428.376.394.868.591 1.36.591.494 0 .986-.197 1.361-.591l3.43-3.602c.505-.532.785-1.24.785-1.991a2.867 2.867 0 00-.784-1.992z"
												fill="#595959"
											/>
										</g>
									</svg>
								</span>`,
							title: language['file']['title'],
							search: '附件,文件,fujian,wenjian,file',
						},
						{
							name: 'video-uploader',
							icon: `<span>
									<svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" version="1.1">
                                        <g stroke="none" strokeWidth="1" fill="none" fill-rule="evenodd">
                                            <g transform="translate(-16.000000, -641.000000)">
                                                <g>
                                                    <g transform="translate(16.000000, 641.000000)">
                                                        <g>
                                                            <rect stroke="#E8E8E8" fill="#FFFFFF" x="0.5" y="0.5" width="23" height="23" rx="2"/>
                                                            <g transform="translate(6.000000, 6.000000)" fill-rule="nonzero">
                                                                <rect fill="#000000" opacity="0" x="0" y="0" width="12" height="12"/>
                                                                <path d="M6,0.75 C3.10078125,0.75 0.75,3.10078125 0.75,6 C0.75,8.89921875 3.10078125,11.25 6,11.25 C8.89921875,11.25 11.25,8.89921875 11.25,6 C11.25,3.10078125 8.89921875,0.75 6,0.75 Z M6,10.359375 C3.59296875,10.359375 1.640625,8.40703125 1.640625,6 C1.640625,3.59296875 3.59296875,1.640625 6,1.640625 C8.40703125,1.640625 10.359375,3.59296875 10.359375,6 C10.359375,8.40703125 8.40703125,10.359375 6,10.359375 Z" id="Shape" fill="#595959"/>
                                                                <path d="M7.93963415,5.8884912 L5.23140244,4.02687575 C5.13445122,3.96020395 5,4.02514402 5,4.13857268 L5,7.86180356 C5,7.97523223 5.13536585,8.03930643 5.23140244,7.97350049 L7.93963415,6.11188505 C8.02012195,6.05646952 8.02012195,5.94390673 7.93963415,5.8884912 Z" id="Shape" fill="#71D19A"/>
                                                            </g>
                                                        </g>
                                                    </g>
                                                </g>
                                            </g>
                                        </g>
                                    </svg>
								</span>`,
							title: language['video']['title'],
							search: '视频,MP4,shipin,video',
						},
						{
							name: 'math',
							icon: `<span>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><g fill="none" fill-rule="evenodd"><rect stroke="#E8E8E8" fill="#FFF" x=".5" y=".5" width="23" height="23" rx="2"/><path d="M14.073 14.18a.122.122 0 01.004.073l-.346 1.404a.122.122 0 01-.119.093H9.438a.122.122 0 01-.122-.122v-.384c0-.067.055-.122.122-.122h.61v-3.924h-.61a.122.122 0 01-.122-.122v-.384c0-.068.055-.122.122-.122h.355l-.012-.063a.976.976 0 00-.96-.8h-.487v3.845H9.35c.068 0 .122.055.122.122v.384a.122.122 0 01-.122.122H6.341a.122.122 0 01-.122-.122v-.384c0-.067.055-.122.122-.122h1.017V9.706H6.87a.976.976 0 00-.96.8l-.097.535h-.437a.122.122 0 01-.122-.132l.143-1.797A.122.122 0 015.52 9h4.654c.064 0 .117.049.122.112l.116 1.458h3.19c.06 0 .113.046.12.107l.214 1.718a.122.122 0 01-.121.137h-.339a.122.122 0 01-.117-.09l-.16-.577a.91.91 0 00-.877-.667h-1.134v1.57h.423c.26 0 .471-.211.471-.471v-.192c0-.068.055-.122.122-.122h.407c.067 0 .122.054.122.122v1.953a.122.122 0 01-.122.122h-.407a.122.122 0 01-.122-.122v-.192a.47.47 0 00-.47-.47h-.424v1.726h1.187c.34 0 .655-.177.832-.467l.291-.475h-.155a.122.122 0 01-.122-.122v-.384c0-.067.054-.122.122-.122h.577l1.468-2.004-1.305-1.92h-.659a.122.122 0 01-.122-.122v-.384c0-.067.055-.122.122-.122h2.196c.067 0 .122.055.122.122v.384a.122.122 0 01-.122.122h-.317l.718 1.057.774-1.057h-.362a.122.122 0 01-.122-.122v-.384c0-.067.055-.122.122-.122h1.87c.068 0 .123.055.123.122v.384a.122.122 0 01-.122.122h-.614l-1.238 1.69 1.518 2.234h.659c.067 0 .122.055.122.122v.384a.122.122 0 01-.122.122h-2.196a.122.122 0 01-.122-.122v-.384c0-.067.055-.122.122-.122h.317l-.931-1.37-1.004 1.37h.398c.068 0 .122.055.122.122v.384a.122.122 0 01-.122.122h-1.14z" fill-opacity=".65" fill="#000"/></g></svg>
								</span>`,
							title: language['math']['title'],
							search: '公式,数学公式,gongshi,formula,math,latex',
						},
						{
							name: 'status',
							icon: `<span>
									<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><g fill="none" fill-rule="evenodd"><rect stroke="#E8E8E8" strokeWidth=".667" fill="#FFF" x=".333" y=".333" width="23.333" height="23.333" rx="1.333"/><g transform="translate(6 6)"><path d="M2.534 6.192L.53 4.34a.667.667 0 01-.144-.788L1.98.37A.667.667 0 012.575 0h9.714c.369 0 .667.298.667.667v5.036a.667.667 0 01-.667.666H2.986a.667.667 0 01-.452-.177z" fill="#BFBFBF"/><path d="M.598 4.07a.267.267 0 00.02.226l4.125 7.146a.267.267 0 00.364.097l4.62-2.666a.267.267 0 00.097-.365L5.698 1.363a.267.267 0 00-.186-.13L2.095.648a.267.267 0 00-.295.17L.598 4.07z" stroke="#595959" strokeWidth=".8" fill="#FFF"/><path d="M3.956 3.036a.667.667 0 11-1.333 0 .667.667 0 011.333 0z" fill="#595959"/><circle fill="#595959" transform="scale(-1 1) rotate(30 0 -9.207)" cx="3.283" cy="3.047" r="1"/></g></g></svg>
								</span>`,
							title: language['status']['title'],
							search: 'status,label,状态',
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
				return (
					!engine.command.queryState('undo') ||
					!engine.command.queryEnabled('undo')
				);
			},
			onActive: () => false,
		},
		{
			type: 'button',
			name: 'redo',
			icon: 'redo',
			title: language['redo']['title'],
			onDisabled: () => {
				return (
					!engine.command.queryState('redo') ||
					!engine.command.queryEnabled('redo')
				);
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
				{ key: '14px', content: '14px', hotkey: false },
				{ key: '15px', content: '15px', hotkey: false },
				{ key: '16px', content: '16px', hotkey: false },
				{ key: '19px', content: '19px', hotkey: false },
				{ key: '22px', content: '22px', hotkey: false },
				{ key: '24px', content: '24px', hotkey: false },
				{ key: '29px', content: '29px', hotkey: false },
				{ key: '32px', content: '32px', hotkey: false },
				{ key: '40px', content: '40px', hotkey: false },
				{ key: '48px', content: '48px', hotkey: false },
			].map((item) =>
				item.key === fontSizeInContainer
					? { ...item, isDefault: true }
					: item,
			),
			onDisabled: () => {
				const tag = engine.command.queryState('heading') || 'p';
				return (
					/^h\d$/.test(tag) ||
					!engine.command.queryEnabled('fontsize')
				);
			},
		},
		{
			type: 'dropdown',
			name: 'fontfamily',
			className: 'toolbar-dropdown-fontfamily',
			title: language['fontfamily']['title'],
			items: fontfamily(fontFamilyDefaultData, {
				...(language['fontfamily']['items'] as {}),
				notInstalled: language['fontfamily']['notInstalled'],
			}),
			onActive: (items) => {
				const values = engine.command.queryState('fontfamily');
				if (!values || !Array.isArray(values) || values.length === 0)
					return '';
				const familys: Array<string> = values[0]
					.split(',')
					.map((name: string) =>
						name.replace(/"/g, '').trim().toLowerCase(),
					);
				return (
					items.find(
						(item) =>
							familys.indexOf(
								(item as any)['faimlyName']
									.trim()
									.toLowerCase(),
							) > -1,
					)?.key || ''
				);
			},
		},
		{
			type: 'button',
			name: 'bold',
			icon: 'bold',
			title: language['bold']['title'],
			onDisabled: () => {
				const tag = engine.command.queryState('heading') || 'p';
				return (
					/^h\d$/.test(tag) || !engine.command.queryEnabled('bold')
				);
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
					disabled: !engine.command.queryEnabled('sup'),
					command: { name: 'sup', args: [] },
				},
				{
					key: 'sub',
					icon: 'sub',
					disabled: !engine.command.queryEnabled('sub'),
					content: language['moremark']['sub'],
					command: { name: 'sub', args: [] },
				},
				{
					key: 'code',
					icon: 'code',
					disabled: !engine.command.queryEnabled('code'),
					content: language['moremark']['code'],
					command: { name: 'code', args: [] },
				},
			],
			onDisabled: () => {
				const plugins = [];
				if (engine.command.queryEnabled('sup') === true)
					plugins.push('sup');
				if (engine.command.queryEnabled('sub') === true)
					plugins.push('sub');
				if (engine.command.queryEnabled('code') === true)
					plugins.push('code');
				return plugins.length === 0;
			},
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
				return `<svg
						width="16px"
						height="16px"
						viewBox="0 0 16 16"
						style="margin-bottom: -2"
					>
						<title>color-font</title>
						<desc>Created with Sketch.</desc>
						<g
							id="color-font"
							stroke="none"
							strokeWidth="1"
							fill="none"
							fill-rule="evenodd"
						>
							<rect
								id="Rectangle-55"
								stroke=${stroke}
								strokeWidth="0.5"
								fill=${color}
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
					</svg>`;
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
				return `<svg
                    width="16px"
                    height="16px"
                    viewBox="0 0 16 16"
                    style="margin-bottom: -2"
					>
                    <g stroke="none" strokeWidth="1" fill="none" fill-rule="evenodd">
                    <rect stroke="${stroke}" strokeWidth="0.5" fill="${color}" x="2" y="12.75" width="12" height="1.5" rx="0.125"></rect>
                    <g transform="translate(2.781250, 1.375000)" fill-rule="nonzero"><path fill="#595959" d="M2.86079849,6.64817222 L2.05713835,5.84451208 C2.00832281,5.79569655 2.00832281,5.71655092 2.05713835,5.66773539 L3.61029491,4.11457882 L3.11963835,3.62392225 C3.07082281,3.57510672 3.07082281,3.49596109 3.11963835,3.44714556 L6.47839556,0.0883883476 C6.52721109,0.0395728112 6.60635672,0.0395728112 6.65517225,0.0883883476 L11.5165314,4.94974747 C11.5653469,4.998563 11.5653469,5.07770863 11.5165314,5.12652416 L8.15777416,8.48528137 C8.10895863,8.53409691 8.029813,8.53409691 7.98099747,8.48528137 L7.38889678,7.89318068 L5.83574021,9.44633725 C5.78692467,9.49515278 5.70777905,9.49515278 5.65896351,9.44633725 L5.0267407,8.81411444 L4.48856529,9.35326519 C4.39477378,9.44720966 4.26747335,9.5 4.13472392,9.5 L0.608857988,9.5 C0.470786801,9.5 0.358857988,9.38807119 0.358857988,9.25 C0.358857988,9.18363253 0.385247413,9.11998865 0.432210608,9.07309408 L2.86079849,6.64817222 Z M6.56678391,1.67937861 L4.71062861,3.53553391 L8.06938582,6.89429112 L9.92554112,5.03813582 L6.56678391,1.67937861 Z M3.64812861,5.75612373 L5.74735186,7.85534699 L6.54284699,7.05985186 L4.44362373,4.96062861 L3.64812861,5.75612373 Z" id="Combined-Shape"></path></g></g>
					</svg>`;
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
			type: 'dropdown',
			name: 'line-height',
			content: () =>
				`<span class="data-icon data-icon-line-height"></span>`,
			title: language['line-height']['title'],
			items: [
				{
					key: 'default',
					content: language['line-height']['default'],
				},
				{
					key: '1',
					content: '1',
				},
				{
					key: '1.15',
					content: '1.15',
				},
				{
					key: '1.5',
					content: '1.5',
				},
				{
					key: '2',
					content: '2',
				},
				{
					key: '2.5',
					content: '2.5',
				},
				{
					key: '3',
					content: '3',
				},
			],
		},
		{
			type: 'button',
			name: 'link',
			icon: 'link',
			command: { name: 'link', args: ['_blank'] },
			title: language['link']['title'],
			onDisabled: () => {
				const { card } = engine;
				const range = isEngine(engine)
					? engine.change.range.get()
					: Range.from(engine);
				if (!range) return !engine.command.queryEnabled('link');
				const cardComponent = card.find(range.startNode);
				return (
					(!!cardComponent &&
						!cardComponent.isCursor(range.startNode)) ||
					range.containsCard() ||
					!engine.command.queryEnabled('link')
				);
			},
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
