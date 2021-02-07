import React, { useRef, useEffect } from 'react';
import { isBrowser } from 'umi';
import Engine, { $, ContentView, ContentViewInterface } from '@aomao/engine';

const ContentRender = ({ content }: { content: string }) => {
	const contentView = useRef<ContentViewInterface>();
	const viewRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (viewRef.current && !contentView.current) {
			contentView.current = new ContentView(viewRef.current, {
				card: Engine.card,
				plugin: Engine.plugin,
			});
		}
	}, []);

	useEffect(() => {
		if (contentView.current) {
			contentView.current.render(content);
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
