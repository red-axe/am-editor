<template>
    <div className="editor-ot-users">
        <space class="editor-ot-users-content" size="small">
			<span v-if="!isMobile" style="color: '#888888'">
                当前在线<strong>{{members.length}}</strong>人
            </span>
            <avatar
            v-for="member in members"
            :key="member['id']"
            size="30"
            :style="`background-color:${member['color']}`"
            >
                {{member['name']}}
            </avatar>
        </space>
    </div>
    <am-toolbar v-if="engine" :engine="engine" :items="items" />
    <div :class="['editor-wrapper',{'editor-mobile': isMobile}]">
        <div class="editor-container">
            <div class="editor-content">
                <div ref="container">This is Container</div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import { Avatar, message, Modal, Space } from 'ant-design-vue'
import Engine, { EngineInterface, isMobile } from "@aomao/engine"
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
import Mention, { MentionComponent } from '@aomao/plugin-mention';
import Quote from '@aomao/plugin-quote';
import PaintFormat from '@aomao/plugin-paintformat';
import RemoveFormat from '@aomao/plugin-removeformat';
import SelectAll from '@aomao/plugin-selectall';
import Link from '@aomao/plugin-link-vue';
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock-vue';
import Image, { ImageComponent, ImageUploader } from '@aomao/plugin-image';
import Table, { TableComponent } from '@aomao/plugin-table'
import Fontfamily from '@aomao/plugin-fontfamily';
import Status, { StatusComponent } from '@aomao/plugin-status';
import Math, { MathComponent } from '@aomao/plugin-math';
import File, { FileComponent, FileUploader } from '@aomao/plugin-file';
import Video, { VideoComponent, VideoUploader } from '@aomao/plugin-video';
import LineHeight from '@aomao/plugin-line-height';
import AmToolbar , { ToolbarPlugin, ToolbarComponent, fontFamilyDefaultData } from '@aomao/toolbar-vue'
import OTClient from './ot-client'
import 'ant-design-vue/es/style'

const plugins = [
	Redo,
	Undo,
	Bold,
	Code,
	Backcolor,
	Fontcolor,
	Fontsize,
    Fontfamily,
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
	ToolbarPlugin,
    Status,
    LineHeight,
    File,
    Video,
    FileUploader,
    VideoUploader,
    Math,
    Mention
];
const cards = [
	HrComponent,
	CheckboxComponent,
	CodeBlockComponent,
	ToolbarComponent,
	ImageComponent,
    TableComponent,
    StatusComponent,
    FileComponent,
    VideoComponent,
    MathComponent,
    MentionComponent
];

const isDev = process.env.NODE_ENV !== 'production';
const domain = isDev ? 'http://localhost:7001' : 'https://editor.aomao.com';

export default defineComponent({
    name:"engine-demo",
    components:{
        Avatar,
        Space,
        AmToolbar
    },
    data(){
        return {
            items:isMobile ? [
                        ['undo', 'redo'],
                        {
                            icon:"text",
                            items:[
                                'bold',
                                'italic',
                                'strikethrough',
                                'underline',
                                'moremark',
                            ]
                        },
                        [
                            {
                                type: "button",
                                name: 'image-uploader',
                                icon: "image"
                            },
                            "link",
                            "tasklist",
                            "heading"
                        ],
                        {
                            icon: "more",
                            items: [
                                {
                                    type: "button",
                                    name: 'video-uploader',
                                    icon: "video"
                                },
                                {
                                    type: "button",
                                    name: 'file-uploader',
                                    icon: "attachment"
                                },
                                {
                                    type: "button",
                                    name: 'table',
                                    icon: "table"
                                },
                                {
                                    type: "button",
                                    name: 'math',
                                    icon: "math"
                                },
                                {
                                    type: "button",
                                    name: 'codeblock',
                                    icon: "codeblock"
                                },
                                {
                                    type: "button",
                                    name: "orderedlist",
                                    icon: "orderedlist"
                                },
                                {
                                    type: "button",
                                    name: "unorderedlist",
                                    icon: "unorderedlist"
                                },
                                {
                                    type: "button",
                                    name: "hr",
                                    icon: "hr"
                                },
                            ]
                        }
                    ]:[['collapse'],
						['undo', 'redo', 'paintformat', 'removeformat'],
						['heading', 'fontfamily', 'fontsize'],
						[
							'bold',
							'italic',
							'strikethrough',
							'underline',
							'moremark',
						],
						['fontcolor', 'backcolor'],
						['alignment'],
						['unorderedlist', 'orderedlist', 'tasklist', 'indent', 'line-height'],
						['link', 'quote', 'hr']]
        }
    },
    setup(){
        const container = ref<HTMLElement | null>(null)
        const engine = ref<EngineInterface | null>(null)
        const members = ref([])
        onMounted(() => {
            if(container.value){
                //实例化引擎
                 const engineInstance = new Engine(container.value,{
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
                        [FileUploader.pluginName]: {
                            action: `${domain}/upload/file`,
                        },
                        [VideoUploader.pluginName]: {
                            action: `${domain}/upload/video`,
                        },
                        [Math.pluginName]: {
                            action: `https://g.aomao.com/latex`,
                            parse: (res: any) => {
                                if (res.success) return { result: true, data: res.svg };
                                return { result: false };
                            },
                        },
                        [Fontsize.pluginName]: {
                            //配置粘贴后需要过滤的字体大小
                            filter: (fontSize: string) => {
                                return ["12px","13px","14px","15px","16px","19px","22px","24px","29px","32px","40px","48px"].indexOf(fontSize) > -1
                            }
                        },
                        [Fontfamily.pluginName]: {
                            //配置粘贴后需要过滤的字体
                            filter: (fontfamily: string) => {
                                const item = fontFamilyDefaultData.find(item => fontfamily.split(",").some(name => item.value.toLowerCase().indexOf(name.replace(/"/,"").toLowerCase()) > -1))
                                return item ? item.value : false
                            }
                        },
                        [LineHeight.pluginName]: {
                            //配置粘贴后需要过滤的行高
                            filter: (lineHeight: string) => {
                                if(lineHeight === "14px") return "1"
                                if(lineHeight === "16px") return "1.15"
                                if(lineHeight === "21px") return "1.5"
                                if(lineHeight === "28px") return "2"
                                if(lineHeight === "35px") return "2.5"
                                if(lineHeight === "42px") return "3"
                                return ["1","1.15","1.5","2","2.5","3"].indexOf(lineHeight) > -1
                            }
                        },
                        [Mention.pluginName]: {
                            action: `${domain}/user/search`,
                            defaultData: [
                                {
                                    key: '1',
                                    name: '输入1-3查询',
                                    avatar: 'https://cdn-image.aomao.com/10012/avatar/2020/04/11/1586596344-3b71be94-c861-428d-a8c3-9a1ebfb82a26.png?x-oss-process=image/resize,w_20',
                                },
                            ],
                            onClick: (key: string, name: string) => {
                                console.log('mention click:', key, '-', name);
                            },
                        }
                    },
                });
                
                engineInstance.messageSuccess = (msg: string) => {
                    message.success(msg);
                };
                engineInstance.messageError = (error: string) => {
                    message.error(error);
                };
                engineInstance.messageConfirm = (msg: string) => {
                    return new Promise<boolean>((resolve, reject) => {
                        Modal.confirm({
                            content: msg,
                            onOk: () => resolve(true),
                            onCancel: () => reject(),
                        });
                    });
                };
                //初始化本地协作，用作记录历史
                engineInstance.ot.initLockMode();

                //设置编辑器值，并使用异步的方式渲染卡片
                engineInstance.setValue("<strong>我在这里哟～</strong>", {
                    enableAsync: true,
                    triggerOT: false, //对于异步渲染后的卡片节点不提交到协同服务端，否则会冲突
                    callback: () => {
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
                    },
                })
                //监听编辑器值改变事件
                engineInstance.on('change', value => {
                    console.log('value', value);
                    console.log('html:', engineInstance.getHtml());
                });
                
                engine.value = engineInstance
            }
        })

        onUnmounted(() => {
            if(engine.value) engine.value.destroy()
        })

        return {
            isMobile,
            container,
            engine,
            members
        }
    }
})
</script>
<style>
#app {
    padding:0
}
#nav {
    position: relative
}
.editor-ot-users {
	font-size: 12px;
	background: #ffffff;
	padding: 0px 0 8px 266px;
	z-index: 999;
	width: 100%;
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
	position: relative;
	width: 100%;
	min-width: 1440px;
}

.editor-wrapper.editor-mobile {
    min-width: auto;
    padding: 0 12px;
}

.editor-container {
	background: #fafafa;
	background-color: #fafafa;
	padding: 62px 0 64px;
	height: calc(100vh - 68px);
	width: 100%;
	margin: 0 auto;
	overflow: auto;
	position: relative;
}

.editor-mobile .editor-container {
    padding: 0;
    height: auto;
    overflow: hidden;
}

.editor-content {
	position: relative;
	width: 812px;
	margin: 0 auto;
	background: #fff;
	border: 1px solid #f0f0f0;
	overflow: hidden;
	min-height: 800px;
    
}

.editor-mobile .editor-content {
    width: auto;
    min-height:calc(100vh - 68px);
    border: 0 none;
}

.editor-content .am-engine {
	padding: 40px 60px 60px;
}

.editor-mobile .editor-content .am-engine {
    padding:18px 0 0 0;
}

</style>