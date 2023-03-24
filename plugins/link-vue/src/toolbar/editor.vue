<template>
	<a-config-provider :auto-insert-space-in-button="false">
		<div data-element="ui" :class="['data-link-editor', className]">
			<p>{{ textTitle }}</p>
			<p>
				<a-input
					class="data-link-input"
					:value="text"
					:placeholder="textPlaceholder"
					@change="onTextChange($event.target.value)"
				/>
			</p>
			<p>{{ linkTitle }}</p>
			<p>
				<a-input
					ref="linkRef"
					class="data-link-input"
					:value="link"
					:placeholder="linkPlaceholder"
					@change="onLinkChange($event.target.value)"
				/>
			</p>
			<p>
				<a-button
					class="data-link-button"
					@click="onOk(text, link)"
					:disabled="link.trim() === ''"
				>
					{{ buttonTitle }}
				</a-button>
			</p>
		</div>
	</a-config-provider>
</template>
<script lang="ts">
import { defineComponent, onMounted, PropType, ref } from 'vue';
import { LanguageInterface } from '@aomao/engine';
import AConfigProvider from 'ant-design-vue/es/config-provider';
import AInput from 'ant-design-vue/es/input';
import AButton from 'ant-design-vue/es/button';
import 'ant-design-vue/es/input/style/css';
import 'ant-design-vue/es/button/style/css';

export default defineComponent({
	name: 'am-link-editor',
	components: {
		AConfigProvider,
		AInput,
		AButton,
	},
	props: {
		language: {
			type: Object as PropType<LanguageInterface>,
			required: true,
		} as const,
		defaultText: String,
		defaultLink: String,
		className: String,
		onLoad: Function as PropType<() => void>,
		onOk: Function as PropType<(text: string, link: string) => void>,
	},
	setup(props) {
		const text = ref(props.defaultText);
		const link = ref(props.defaultLink);
		const linkRef = ref<HTMLElement | null>(null);
		const textTitle = props.language.get<string>('link', 'text');
		const textPlaceholder = props.language.get<string>(
			'link',
			'text_placeholder',
		);

		const linkTitle = props.language.get<string>('link', 'link');
		const linkPlaceholder = props.language.get<string>(
			'link',
			'link_placeholder',
		);

		const buttonTitle = props.language.get<string>('link', 'ok_button');

		const onTextChange = (value: string) => {
			text.value = value;
		};

		const onLinkChange = (value: string) => {
			link.value = value;
		};

		onMounted(() => {
			if (linkRef.value) linkRef.value.focus();
			setTimeout(() => {
				if (props.onLoad) props.onLoad();
			}, 200);
		});

		return {
			text,
			link,
			textTitle,
			textPlaceholder,
			linkTitle,
			linkPlaceholder,
			buttonTitle,
			onTextChange,
			onLinkChange,
			linkRef,
		};
	},
});
</script>
