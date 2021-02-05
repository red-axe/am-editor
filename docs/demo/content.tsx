import React from 'react';
import Engine, { $, ContentView } from '@aomao/engine';

const ServerRender = ({ content }: { content: string }) => {
  const container = $('<div></div>');
  const contentView = new ContentView(container, {
    card: Engine.card,
    plugin: Engine.plugin,
  });

  contentView.render(content);
  return (
    <div
      className={container.attr('class')}
      dangerouslySetInnerHTML={{ __html: container.html() }}
    ></div>
  );
};

export default ServerRender;
