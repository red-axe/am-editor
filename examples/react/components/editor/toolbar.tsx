import React, { FC } from 'react';
import { isMobile } from '@aomao/engine';
import Toolbar, { ToolbarProps } from '@aomao/toolbar';

export type ToolbarItemProps = ToolbarProps['items'];

const defaultItems = (): ToolbarItemProps => {
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
				['collapse'],
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
> = ({ engine, items, className }) => {
	return (
		<Toolbar
			className={className}
			engine={engine}
			items={items || defaultItems()}
		/>
	);
};

export default ToolbarExample;
