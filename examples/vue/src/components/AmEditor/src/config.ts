import { PluginEntry, CardEntry, PluginOptions, NodeInterface } from '@aomao/engine'
//引入插件 begin
import Redo from '@aomao/plugin-redo'
import Undo from '@aomao/plugin-undo'
import Bold from '@aomao/plugin-bold'
import Code from '@aomao/plugin-code'
import Backcolor from '@aomao/plugin-backcolor'
import Fontcolor from '@aomao/plugin-fontcolor'
import Fontsize from '@aomao/plugin-fontsize'
import Italic from '@aomao/plugin-italic'
import Underline from '@aomao/plugin-underline'
import Hr, { HrComponent } from '@aomao/plugin-hr'
import Tasklist, { CheckboxComponent } from '@aomao/plugin-tasklist'
import Orderedlist from '@aomao/plugin-orderedlist'
import Unorderedlist from '@aomao/plugin-unorderedlist'
import Indent from '@aomao/plugin-indent'
import Heading from '@aomao/plugin-heading'
import Strikethrough from '@aomao/plugin-strikethrough'
import Sub from '@aomao/plugin-sub'
import Sup from '@aomao/plugin-sup'
import Alignment from '@aomao/plugin-alignment'
import Mark from '@aomao/plugin-mark'
import Quote from '@aomao/plugin-quote'
import PaintFormat from '@aomao/plugin-paintformat'
import RemoveFormat from '@aomao/plugin-removeformat'
import SelectAll from '@aomao/plugin-selectall'
import Link from '@aomao/plugin-link-vue'
import Codeblock, { CodeBlockComponent } from '@aomao/plugin-codeblock-vue'
import Image, { ImageComponent, ImageUploader } from '@aomao/plugin-image'
import Table, { TableComponent } from '@aomao/plugin-table'
import File, { FileComponent, FileUploader } from '@aomao/plugin-file'
import Video, { VideoComponent, VideoUploader } from '@aomao/plugin-video'
import Math, { MathComponent } from '@aomao/plugin-math'
import Fontfamily from '@aomao/plugin-fontfamily'
import Status, { StatusComponent } from '@aomao/plugin-status'
import LineHeight from '@aomao/plugin-line-height'
import Mention, { MentionComponent } from '@aomao/plugin-mention'
import {
  ToolbarPlugin,
  ToolbarComponent,
  fontFamilyDefaultData,
} from '@aomao/toolbar-vue'

import Empty from 'ant-design-vue/es/empty'
import 'ant-design-vue/es/empty/style'
import { createApp } from 'vue'
import Loading from '../src/loading.vue'
import MentionPopover from '../src/mention.vue'

const DOMAIN = 'https://editor.aomao.com/api'

export const plugins: Array<PluginEntry> = [
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
  File,
  FileUploader,
  Video,
  VideoUploader,
  Math,
  ToolbarPlugin,
  Fontfamily,
  Status,
  LineHeight,
  Mention,
]

export const cards: Array<CardEntry> = [
  HrComponent,
  CheckboxComponent,
  CodeBlockComponent,
  ImageComponent,
  TableComponent,
  FileComponent,
  VideoComponent,
  MathComponent,
  ToolbarComponent,
  StatusComponent,
  MentionComponent,
]

export const pluginConfig: { [key: string]: PluginOptions } = {
  [ToolbarPlugin.pluginName]: {
    popup: {
      items: [
        ['bold', 'strikethrough', 'fontcolor'],
        {
          icon: 'text',
          items: ['italic', 'underline', 'backcolor', 'moremark'],
        },
        [
          {
            type: 'button',
            name: 'image-uploader',
            icon: 'image',
          },
          'link',
          'tasklist',
          'heading',
        ],
        {
          icon: 'more',
          items: [
            {
              type: 'button',
              name: 'video-uploader',
              icon: 'video',
            },
            {
              type: 'button',
              name: 'file-uploader',
              icon: 'attachment',
            },
            {
              type: 'button',
              name: 'table',
              icon: 'table',
            },
            {
              type: 'button',
              name: 'math',
              icon: 'math',
            },
            {
              type: 'button',
              name: 'codeblock',
              icon: 'codeblock',
            },
            {
              type: 'button',
              name: 'orderedlist',
              icon: 'ordered-list',
            },
            {
              type: 'button',
              name: 'unordered-list',
              icon: 'unordered-list',
            },
            {
              type: 'button',
              name: 'hr',
              icon: 'hr',
            },
            {
              type: 'button',
              name: 'quote',
              icon: 'quote',
            },
          ],
        },
      ],
    },
  },
  [Italic.pluginName]: {
    // 默认为 _ 下划线，这里修改为单个 * 号
    markdown: '*',
  },
  [Image.pluginName]: {
    onBeforeRender: (status: string, url: string) => {
      if (url.startsWith('data:image/')) return url
      return url + `?token=12323`
    },
  },
  [ImageUploader.pluginName]: {
    file: {
      action: `${DOMAIN}/upload/image`,
      headers: { Authorization: 213434 },
    },
    remote: {
      action: `${DOMAIN}/upload/image`,
    },
    isRemote: (src: string) => src.indexOf(DOMAIN) < 0,
  },
  [FileUploader.pluginName]: {
    action: `${DOMAIN}/upload/file`,
  },
  [VideoUploader.pluginName]: {
    action: `${DOMAIN}/upload/video`,
    limitSize: 1024 * 1024 * 50,
  },
  [Video.pluginName]: {
    onBeforeRender: (status: string, url: string) => {
      return url + `?token=12323`
    },
  },
  [Math.pluginName]: {
    action: `https://g.aomao.com/latex`,
    parse: (res: any) => {
      if (res.success) return { result: true, data: res.svg }
      return { result: false }
    },
  },
  [Mention.pluginName]: {
    action: `${DOMAIN}/user/search`,
    onLoading: (root: NodeInterface) => {
      const vm = createApp(Loading)
      vm.mount(root.get<HTMLElement>()!)
    },
    onEmpty: (root: NodeInterface) => {
      const vm = createApp(Empty)
      vm.mount(root.get<HTMLElement>()!)
    },
    onClick: (root: NodeInterface, { key, name }: { key: string; name: string }) => {
      console.log('mention click:', key, '-', name)
    },
    onMouseEnter: (layout: NodeInterface, { name }: { key: string; name: string }) => {
      const vm = createApp(MentionPopover, {
        name,
      })
      vm.mount(layout.get<HTMLElement>()!)
    },
  },
  [Fontsize.pluginName]: {
    //配置粘贴后需要过滤的字体大小
    filter: (fontSize: string) => {
      return (
        [
          '12px',
          '13px',
          '14px',
          '15px',
          '16px',
          '19px',
          '22px',
          '24px',
          '29px',
          '32px',
          '40px',
          '48px',
        ].indexOf(fontSize) > -1
      )
    },
  },
  [Fontfamily.pluginName]: {
    //配置粘贴后需要过滤的字体
    filter: (fontfamily: string) => {
      const item = fontFamilyDefaultData.find((item) =>
        fontfamily
          .split(',')
          .some(
            (name) =>
              item.value.toLowerCase().indexOf(name.replace(/"/, '').toLowerCase()) > -1
          )
      )
      return item ? item.value : false
    },
  },
  [LineHeight.pluginName]: {
    //配置粘贴后需要过滤的行高
    filter: (lineHeight: string) => {
      if (lineHeight === '14px') return '1'
      if (lineHeight === '16px') return '1.15'
      if (lineHeight === '21px') return '1.5'
      if (lineHeight === '28px') return '2'
      if (lineHeight === '35px') return '2.5'
      if (lineHeight === '42px') return '3'
      // 不满足条件就移除掉
      return ['1', '1.15', '1.5', '2', '2.5', '3'].indexOf(lineHeight) > -1
    },
  },
}
