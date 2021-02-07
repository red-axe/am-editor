import { EngineInterface } from '../../types/engine';

export default (engine: EngineInterface, e: Event) => {
	const { change } = engine;
	e.preventDefault();
	change.insertText('    ');
	return false;
};
