import { FC } from 'react';
import { isMobile } from '@aomao/engine';
import Toolbar, { ToolbarProps } from '@aomao/toolbar';

export type ToolbarItemProps = ToolbarProps['items'];

const defaultItems: ToolbarItemProps = (lang: string) => {
	return isMobile
		? [
				['undo', 'redo'],
				{
					icon: 'text',
					items: [
						'bold',
						'italic',
						'strikethrough',
						'underline',
						'fontsize',
						'fontcolor',
						'backcolor',
						'moremark',
					],
				},
				[
					{
						type: 'button',
						name: 'image-uploader',
						icon: 'image',
					},
					'link',
					'tasklist',
					'heading',
				],
				{
					icon: 'more',
					items: [
						{
							type: 'button',
							name: 'video-uploader',
							icon: 'video',
						},
						{
							type: 'button',
							name: 'file-uploader',
							icon: 'attachment',
						},
						{
							type: 'button',
							name: 'table',
							icon: 'table',
						},
						{
							type: 'button',
							name: 'math',
							icon: 'math',
						},
						{
							type: 'button',
							name: 'codeblock',
							icon: 'codeblock',
						},
						{
							type: 'button',
							name: 'orderedlist',
							icon: 'ordered-list',
						},
						{
							type: 'button',
							name: 'unorderedlist',
							icon: 'unordered-list',
						},
						{
							type: 'button',
							name: 'hr',
							icon: 'hr',
						},
						{
							type: 'button',
							name: 'quote',
							icon: 'quote',
						},
					],
				},
		  ]
		: [
				[
					{
						type: 'collapse',
						groups: [
							{
								items: [
									'image-uploader',
									'codeblock',
									'table',
									'file-uploader',
									'video-uploader',
									'status',
									{
										name: 'lightblock',
										icon: (
											<span>
												<svg
													viewBox="0 0 1024 1024"
													version="1.1"
													xmlns="http://www.w3.org/2000/svg"
													p-id="16506"
													width="20"
													height="20"
												>
													<path
														d="M334.381005 532.396498c-43.065755-49.294608-63.309781-112.604389-57.006228-178.291306 10.574825-110.073758 97.919974-198.776832 207.71744-210.893776 68.155127-7.538682 133.543239 13.271232 184.12721 58.571883 49.904497 44.705089 78.529384 108.733229 78.529384 175.681881 0 58.288428-21.461758 114.226326-60.43532 157.530511-33.148915 36.840996-52.83217 85.053971-56.389176 137.225087H528.321701V438.869569c0-9.007123-7.311508-16.319655-16.323748-16.319655-9.014286 0-16.312492 7.312531-16.312491 16.324771v233.34507H393.113547c-3.619427-51.119159-24.146908-100.241852-58.732542-139.823257z m267.534684 349.898389H422.088404c-15.65553 0-28.397714-12.72888-28.397714-28.38441v-13.222113h236.617596v13.222113c0.001023 15.648367-12.737067 28.384411-28.392597 28.38441z m28.393621-176.619226v40.79095h-236.61862V704.913299l236.61862 0.762362z m0 102.380557h-236.61862v-28.945182h236.617596v28.945182h0.001024z m-269.255882 45.853236c0 33.645217 27.378503 61.036 61.035999 61.035999h179.827286c33.65238 0 61.036-27.390782 61.035999-61.035999V689.406148c0-50.646392 17.267234-97.71736 48.62639-132.56803 44.377631-49.313027 68.815158-113.009617 68.815158-179.372938 0-76.212623-32.576888-149.107695-89.390734-199.987401-57.609977-51.586809-132.021585-75.230251-209.499013-66.725571-125.072327 13.823816-224.583539 114.852588-236.613503 240.230883-7.177455 74.713483 15.876564 146.765352 64.907159 202.899725 33.056817 37.817228 51.255258 85.643394 51.255259 134.65557v165.371068z"
														p-id="16507"
													></path>
												</svg>
											</span>
										),
										title:
											lang === 'zh-CN'
												? '高亮块'
												: 'light-block',
										search: 'light,light-block,remind,高亮块',
									},
								],
							},
						],
					},
				],
				['undo', 'redo', 'paintformat', 'removeformat'],
				['heading', 'fontfamily', 'fontsize'],
				['bold', 'italic', 'strikethrough', 'underline', 'moremark'],
				['fontcolor', 'backcolor'],
				['alignment'],
				[
					'unorderedlist',
					'orderedlist',
					'tasklist',
					'indent',
					'line-height',
				],
				['link', 'quote', 'hr'],
		  ];
};

const ToolbarExample: FC<
	Omit<ToolbarProps, 'items'> & { items?: ToolbarItemProps }
> = ({ engine, items, lang, className }) => {
	return (
		<Toolbar
			className={className}
			engine={engine}
			items={items || defaultItems(lang)}
		/>
	);
};

export default ToolbarExample;
