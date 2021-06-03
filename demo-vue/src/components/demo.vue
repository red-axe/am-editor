<template>
    <div className="editor-ot-users">
        <p style="color: '#888888'">
            当前在线用户：<strong>{{members.length}}</strong> 人
        </p>
        <div class="editor-ot-users-content">
            <avatar
            v-for="member in members"
            :key="member['id']"
            size="30"
            :style="`background-color:${member['color']}`"
            >
                {{member['name']}}
            </avatar>
        </div>
    </div>
    <am-toolbar v-if="engine" :engine="engine" :items="items" />
    <div className="editor-wrapper">
        <div className="editor-container">
            <div ref="container">This is Container</div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { Avatar, message } from 'ant-design-vue'
import Engine, { EngineInterface } from "@aomao/engine"
import Redo from '@aomao/plugin-redo';
import Undo from '@aomao/plugin-undo';
import Bold from '@aomao/plugin-bold';
import Code from '@aomao/plugin-code';
import Backcolor from '@aomao/plugin-backcolor';
import Fontcolor from '@aomao/plugin-fontcolor';
import Fontsize from '@aomao/plugin-fontsize';
import Italic from '@aomao/plugin-italic';
import Underline from '@aomao/plugin-underline';
import Hr, { HrComponent } from '@aomao/plugin-hr';
import Tasklist, { CheckboxComponent } from '@aomao/plugin-tasklist';
import Orderedlist from '@aomao/plugin-orderedlist';
import Unorderedlist from '@aomao/plugin-unorderedlist';
import Indent from '@aomao/plugin-indent';
import Heading from '@aomao/plugin-heading';
import Strikethrough from '@aomao/plugin-strikethrough';
import Sub from '@aomao/plugin-sub';
import Sup from '@aomao/plugin-sup';
import Alignment from '@aomao/plugin-alignment';
import Mark from '@aomao/plugin-mark';
import Quote from '@aomao/plugin-quote';
import PaintFormat from '@aomao/plugin-paintformat';
import RemoveFormat from '@aomao/plugin-removeformat';
import SelectAll from '@aomao/plugin-selectall';
import Link from '@aomao/plugin-link-vue';
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock-vue';
import Image, { ImageComponent, ImageUploader } from '@aomao/plugin-image';
import Table, { TableComponent } from '@aomao/plugin-table'
import AmToolbar , { ToolbarPlugin, ToolbarComponent } from '@aomao/toolbar-vue'
import OTClient from './ot-client'

const plugins = [
	Redo,
	Undo,
	Bold,
	Code,
	Backcolor,
	Fontcolor,
	Fontsize,
	Italic,
	Underline,
	Hr,
	Tasklist,
	Orderedlist,
	Unorderedlist,
	Indent,
	Heading,
	Strikethrough,
	Sub,
	Sup,
	Alignment,
	Mark,
	Quote,
	PaintFormat,
	RemoveFormat,
	SelectAll,
	Link,
	Codeblock,
	Image,
	ImageUploader,
    Table,
	ToolbarPlugin
];
const cards = [
	HrComponent,
	CheckboxComponent,
	CodeBlockComponent,
	ToolbarComponent,
	ImageComponent,
    TableComponent
];

const isDev = process.env.NODE_ENV !== 'production';
const domain = isDev ? 'http://localhost:7001' : 'https://editor.aomao.com';

export default defineComponent({
    name:"engine-demo",
    components:{
        Avatar,
        AmToolbar
    },
    data(){
        return {
            items:[['collapse'],
						['undo', 'redo', 'paintformat', 'removeformat'],
						['heading', 'fontsize'],
						[
							'bold',
							'italic',
							'strikethrough',
							'underline',
							'moremark',
						],
						['fontcolor', 'backcolor'],
						['alignment'],
						['unorderedlist', 'orderedlist', 'tasklist', 'indent'],
						['link', 'quote', 'hr'],]
        }
    },
    setup(){
        const container = ref<HTMLElement | null>(null)
        const engine = ref<EngineInterface | null>(null)
        const members = ref([])
        onMounted(() => {
            if(container.value){
                //实例化引擎
                engine.value = new Engine(container.value,{
                    plugins,
                    cards,
                    config: {
                        [ImageUploader.pluginName]: {
                            file: {
                                action: `${domain}/upload/image`,
                            },
                            remote: {
                                action: `${domain}/upload/image`,
                            },
                            isRemote: (src: string) => src.indexOf(domain) < 0,
                        },
                    },
                });
                const engineInstance = engine.value
                engineInstance.messageSuccess = (msg: string) => {
                    message.success(msg);
                };
                engineInstance.messageError = (error: string) => {
                    message.error(error);
                };
                //初始化本地协作，用作记录历史
                engineInstance.ot.initLockMode();

                //设置编辑器值
                engineInstance.setValue("<strong>我在这里哟～</strong>")
                //监听编辑器值改变事件
                engineInstance.on('change', value => {
                    console.log('value', value);
                    console.log('html:', engineInstance.getHtml());
                });
                //获取当前保存的用户信息
                const memberData = localStorage.getItem('member');
                const currentMember = !!memberData ? JSON.parse(memberData) : null;
                //实例化协作编辑客户端
                const otClient = new OTClient(engineInstance);
                //连接到协作服务端，demo文档
                const ws = isDev ? 'ws://127.0.0.1:8080' : 'wss://collab.aomao.com';
                otClient.connect(
                    `${ws}${currentMember ? '?uid=' + currentMember.id : ''}`,
                    'demo',
                );
                otClient.on('ready', member => {
                    //保存当前会员信息
                    if (member) localStorage.setItem('member', JSON.stringify(member));
                });
                //用户加入或退出改变
                otClient.on('membersChange', members => {
                    members.value = members;
                });
            }
        })

        onUnmounted(() => {
            if(engine.value) engine.value.destroy()
        })

        return {
            container,
            engine,
            members
        }
    }
})
</script>
<style>
.editor-ot-users {
	margin-top: 42px;
	width: 200px;
	font-size: 12px;
	position: fixed;
	left: 0;
	background: #ffffff;
	min-height: 100%;
	padding: 10px;
	z-index: 999;
	box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.08);
}
.editor-ot-users-content {
	display: flex;
	flex-wrap: wrap;
}

.editor-ot-users .ant-avatar {
	margin: 0 2px;
}
.editor-toolbar {
	position: fixed;
	width: 100%;
	background: #ffffff;
	box-shadow: 0 2px 2px 0 rgba(0, 0, 0, 0.02);
	z-index: 1000;
}

.editor-wrapper {
	background: #fafafa;
	padding: 62px 0;
	height: calc(100vh - 20px);
	overflow: auto;
}

.editor-container {
	position: relative;
	width: 812px;
	margin: 0 auto;
	background: #fff;
	border: 1px solid #f0f0f0;
}

.editor-container .am-engine {
	min-height: 824px;
	padding: 40px 60px 90px;
}
</style>