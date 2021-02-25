import isHotkey from 'is-hotkey';
import $ from '../../node';
import inlineCard from './inline-card';
import blockCard from './block-card';
import tab from './tab';
import backspace, { backspaceCard } from './backspace';
import shiftEnter from './shift-enter';
import enter from './enter';
import { EngineInterface } from '../../types/engine';
import _delete from './delete';
import { isSafari } from '../../utils';
import { CardType } from '../../types/card';
import { pluginKeydownTrigger } from '../utils';

export default (engine: EngineInterface, e: KeyboardEvent) => {
	if (engine.readonly) {
		if (isHotkey('mod+a', e)) e.preventDefault();
	} else if (!engine.card.find($(e.target || []))) {
		if (
			isHotkey('enter', e) &&
			pluginKeydownTrigger(engine, 'enter', e) !== false
		) {
			enter(engine, e);
			if (engine.scrollNode)
				engine.change
					.getRange()
					.scrollIntoViewIfNeeded(
						engine.container,
						engine.scrollNode,
					);
			return;
		}
		if (isHotkey('shift+enter', e)) {
			shiftEnter(engine.change, e);
			if (engine.scrollNode)
				engine.change
					.getRange()
					.scrollIntoViewIfNeeded(
						engine.container,
						engine.scrollNode,
					);
			return;
		}

		if (isHotkey('backspace', e)) {
			if (pluginKeydownTrigger(engine, 'backspace', e) !== false)
				backspace(engine, e);
		} else if (isHotkey('delete', e)) {
			if (pluginKeydownTrigger(engine, 'backspace', e) !== false)
				_delete(engine, e);
		} else if (isHotkey('mod+backspace', e)) {
			if (isSafari) {
				const range = engine.change.getRange();
				if (range.collapsed) {
					const card = engine.card.find(range.startNode);
					if (card) backspaceCard(engine, range, card, e);
				}
			}
		} else if (isHotkey('tab', e)) {
			if (pluginKeydownTrigger(engine, 'tab', e) !== false)
				tab(engine, e);
		} else if (isHotkey('shift+tab', e)) {
			pluginKeydownTrigger(engine, 'shift-tab', e);
		} else {
			const { change } = engine;
			const range = change.getRange();
			const card = engine.card.getSingleCard(range);
			if (
				card &&
				(card.type === CardType.INLINE
					? inlineCard(engine, card, e)
					: blockCard(engine, card, e)) === false
			)
				return;
			if (e.key === ' ') {
				pluginKeydownTrigger(engine, 'space', e);
				return;
			}
			// 在 Windows 下使用中文输入法， keyCode 为 229，需要通过 code 判断
			if (
				e.key === '@' ||
				(e.shiftKey && e.keyCode === 229 && e.code === 'Digit2')
			) {
				pluginKeydownTrigger(engine, 'at', e);
				return;
			}
			// 搜狗输入法在中文输入状态下，输入“/”变成“、”，所以需要加额外的 keyCode 判断
			// Windows 下用微软拼音输入法（即系统默认输入法）时，输入“/”后，keyCode 为 229
			if (
				e.key === '/' ||
				isHotkey('/', e) ||
				(e.keyCode === 229 && e.code === 'Slash')
			) {
				pluginKeydownTrigger(engine, 'slash', e);
				return;
			}

			if (isHotkey('mod+a', e)) {
				pluginKeydownTrigger(engine, 'selectall', e);
				return;
			}
		}
	}
};
