import { createApp } from 'vue';
import Select from './component.vue';

export { Select };

export default (
	container: HTMLElement,
	mode: string,
	onSelect?: (value: string) => void,
) => {
	const vm = createApp(Select, {
		defaultValue: mode,
		getContainer: container ? () => container : undefined,
		onSelect,
	});
	vm.mount(container);
	return vm;
};
