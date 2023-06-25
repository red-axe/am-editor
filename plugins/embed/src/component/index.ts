import { EmbedOptions, EmbedRenderBeforeEvent } from '../types';
import {
	$,
	Card,
	CardType,
	CardValue,
	isHotkey,
	escape,
	NodeInterface,
	CardToolbarItemOptions,
	ToolbarItemOptions,
	sanitizeUrl,
	isEngine,
} from '@aomao/engine';
import { EmbedValue } from '..';
import './index.css';

class EmbedComponent<V extends EmbedValue = EmbedValue> extends Card<V> {
	renderBefore?: EmbedRenderBeforeEvent;

	static get cardName() {
		return 'embed';
	}

	static get cardType() {
		return CardType.BLOCK;
	}

	static get lazyRender() {
		return true;
	}

	static get singleSelectable() {
		return false;
	}

	static get autoSelected() {
		return false;
	}

	#mask?: NodeInterface;
	#iframe?: NodeInterface;

	resize = () => {
		const value = this.getValue();
		if (!value?.isResize) return;
		return this.#iframe?.parent();
	};

	onActivate(activated: boolean) {
		super.onActivate(activated);
		if (activated) this.#mask?.hide();
		else if (isEngine(this.editor)) this.#mask?.show();
	}

	collapse() {
		const value = this.getValue();
		if (value?.collapsed) return;
		this.setValue({
			collapsed: true,
		} as V);
		this.render();
		super.didRender();
	}

	expand() {
		const value = this.getValue();
		if (!value?.collapsed) return;
		this.setValue({
			collapsed: false,
		} as V);
		this.render();
		super.didRender();
	}

	toolbar() {
		const editor = this.editor;
		const getItems = () => {
			if (isEngine(editor)) {
				const items: Array<
					CardToolbarItemOptions | ToolbarItemOptions
				> = [];
				const value = this.getValue();
				if (value?.url) {
					items.push(
						{
							key: 'expand',
							type: 'button',
							content:
								'<span class="data-icon data-icon-expand" />',
							title: editor.language.get<string>(
								'embed',
								'expand',
							),
							onClick: () => this.expand(),
						},
						{
							key: 'collapse',
							type: 'button',
							content:
								'<span class="data-icon data-icon-compact-display" />',
							title: editor.language.get<string>(
								'embed',
								'collapse',
							),
							onClick: () => this.collapse(),
						},
					);
				}
				if (!editor.readonly) {
					items.unshift(
						{ key: 'dnd', type: 'dnd' },
						{ key: 'copy', type: 'copy' },
						{ key: 'delete', type: 'delete' },
						{ key: 'separator', type: 'separator' },
					);
				}
				return items;
			}
			return [];
		};
		const options =
			editor.plugin.findPlugin<EmbedOptions>('embed')?.options;
		if (options?.cardToolbars) {
			return options.cardToolbars(getItems(), this.editor);
		}
		return getItems();
	}

	handleInputKeydown(e: KeyboardEvent) {
		if (isHotkey('enter', e)) this.handleSubmit();
	}

	handleSubmit = () => {
		const editor = this.editor;
		const locales = editor.language.get('embed');
		const center = this.getCenter();
		const url = sanitizeUrl(
			center.find('[data-role="url"]').get<HTMLInputElement>()?.value ||
				'',
		);
		if (url) {
			let value: EmbedValue = {
				url,
				title: url,
				ico: '<span class="data-icon data-icon-website"></span>',
				isResize: true,
			};
			if (this.renderBefore) {
				const info = this.renderBefore(url);
				value = {
					...value,
					...info,
				};
			}
			this.setValue(value as V);
			this.render();
			super.didRender();
		} else {
			editor.messageError('embed', locales['addressInvalid']);
		}
	};

	/**
	 * 渲染输入url的输入框
	 */
	renderEdit(placeholder?: string) {
		const locales = this.editor.language.get('embed');
		const embedNode = $(`<div class="data-embed data-embed-active">
                <div class="data-embed-form">
                    <span class="data-embed-editor">
                        <input data-role="url" placeholder="${
							placeholder || locales['placeholder']
						}" spellcheck="false" class="data-embed-input" value="" autocomplete="off"/>
                    </span>
                    <span class="data-embed-button">
                        <button type="button" class="data-embed-ui-button" data-role="submit">
                            <span>${locales['submit']}</span>
                        </button>
                    </span>
                </div>
            </div>`);
		const urlInput = embedNode.find('[data-role="url"]');
		urlInput.on('keydown', (e) => this.handleInputKeydown(e));
		const submitBtn = embedNode.find('[data-role="submit"]');
		submitBtn.on('click', this.handleSubmit);
		return embedNode;
	}

	renderCollapse() {
		const value = this.getValue();
		const url = value?.url || '';
		const container = `<div class="data-embed data-embed-collapse">
            <span class="data-embed-ico">${value?.ico}</span>
            <span class="data-embed-title"><a target="_blank" href="${url}">${escape(
			value?.title || '',
		)}</a></span>
            <a target="_blank" class="data-icon data-icon-preview" href="${url}" />
        </div>
        `;
		return $(container);
	}

	renderExpand() {
		const value = this.getValue();
		const url = value?.url || '';
		const height = value?.height || 'auto';

		const container = $(`
            <div class="data-embed data-embed-expand">
                <div class="data-embed-header">
                    ${value?.ico}
                    <span class="data-embed-title"><a target="_blank" href="${url}">${escape(
			value?.title || '',
		)}</a></span>
                    <a target="_blank" class="data-icon data-icon-preview" href="${url}"></a>
                </div>
                <div class="data-embed-body" style="height:${height}${
			height === 'auto' ? '' : 'px'
		}">
                    <div class="data-embed-content-bg">
                        <svg viewBox="0 0 1024 1024" class="data-embed-spin" data-icon="loading" width="1em" height="1em" fill="currentColor" aria-hidden="true"> <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 0 0-94.3-139.9 437.71 437.71 0 0 0-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path></svg>
                    </div>
                    <iframe frameborder="0" allowfullscreen="true"></iframe>
                    <div class="data-embed-mask"></div>
                </div>
            </div>
        `);
		const iframe = container.find('iframe');
		iframe.on('load', () => {
			container.find('.data-embed-content-bg').hide();
		});
		this.#mask = container.find('.data-embed-mask');
		if (this.activated) {
			this.#mask.hide();
		}
		if (value?.height) {
			iframe.attributes('data-height', value.height);
		}
		iframe.attributes('src', url);
		this.#iframe = iframe;
		return container;
	}

	/**
	 * 渲染
	 */
	render(
		renderBefore?: EmbedRenderBeforeEvent,
	): string | void | NodeInterface {
		this.renderBefore = renderBefore;
		const value = this.getValue();
		const url = value?.url || '';
		const center = this.getCenter();
		center.empty();
		// 没有url渲染输入框
		if (!url || !value) {
			center.append(this.renderEdit());
			return;
		}
		if (value.collapsed) {
			center.append(this.renderCollapse());
		} else {
			center.append(this.renderExpand());
		}
	}
}

export default EmbedComponent;
