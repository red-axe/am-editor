import { createApp } from 'vue';
import Select from './component.vue';

export { Select };

export default (
	container: HTMLElement,
	modeDatas: { value: string; syntax: string; name: string }[],
	defaultValue: string,
	onSelect?: (value: string) => void,
) => {
	const vm = createApp(Select, {
		modeDatas,
		defaultValue,
		getContainer: container ? () => container : undefined,
		onSelect,
	});
	vm.mount(container);
	return vm;
};
