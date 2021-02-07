import React, { useRef, useEffect } from 'react';
import { isBrowser } from 'umi';
import Engine, { $, ContentView, ContentViewInterface } from '@aomao/engine';

const ContentRender = ({ content }: { content: string }) => {
	const contentView = useRef<ContentViewInterface>();
	const viewRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (viewRef.current && !contentView.current) {
			//初始化
			contentView.current = new ContentView(viewRef.current, {
				card: Engine.card,
				plugin: Engine.plugin,
			});
		}
	}, []);

	useEffect(() => {
		if (contentView.current) {
			//渲染内容到viewRef节点下
			contentView.current.render(content);
			//触发渲染完成事件，用来展示插件的特俗效果。例如在heading插件中，展示锚点显示功能
			contentView.current.event.trigger('render', viewRef.current);
		}
	}, [content]);

	//服务端渲染
	const renderServer = () => {
		const container = $('<div></div>');
		const view = new ContentView(container, {
			card: Engine.card,
			plugin: Engine.plugin,
		});
		//渲染内容到container节点下
		view.render(content);
		return (
			<div
				className={container.attr('class')}
				dangerouslySetInnerHTML={{ __html: container.html() }}
			></div>
		);
	};
	//普通渲染
	const render = () => {
		return <div ref={viewRef} />;
	};
	return isBrowser() ? render() : renderServer();
};

export default ContentRender;
