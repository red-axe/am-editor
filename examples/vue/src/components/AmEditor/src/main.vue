<template>
  <AmLoading :loading="loading">
    <AmToolbar v-if="engine" :engine="engine" :items="items" />
    <div :class="['editor-wrapper', { 'editor-mobile': isMobile }]">
      <div class="editor-container text-left">
        <div class="editor-content">
          <div ref="container"></div>
        </div>
      </div>
    </div>
  </AmLoading>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import Engine, { $, EngineInterface, isMobile } from '@aomao/engine'
import AmToolbar, { GroupItemProps } from '@aomao/toolbar-vue'
import AmLoading from './loading.vue'
import { cards, plugins, pluginConfig } from './config'
import 'ant-design-vue/es/style'
import { demoContent } from './demoData'

// toolbar
const items = isMobile
  ? ref<GroupItemProps[]>([
      ['undo', 'redo'],
      {
        icon: 'text',
        items: ['bold', 'italic', 'strikethrough', 'underline', 'moremark'],
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
            icon: 'orderedlist',
          },
          {
            type: 'button',
            name: 'unorderedlist',
            icon: 'unorderedlist',
          },
          {
            type: 'button',
            name: 'hr',
            icon: 'hr',
          },
        ],
      },
    ])
  : ref<GroupItemProps[]>([
      ['collapse'],
      ['undo', 'redo', 'paintformat', 'removeformat'],
      ['heading', 'fontfamily', 'fontsize'],
      ['bold', 'italic', 'strikethrough', 'underline', 'moremark'],
      ['fontcolor', 'backcolor'],
      ['alignment'],
      ['unorderedlist', 'orderedlist', 'tasklist', 'indent', 'line-height'],
      ['link', 'quote', 'hr'],
    ])

// 编辑器容器
const container = ref<HTMLElement | null>(null)
// 编辑器引擎
const engine = ref<EngineInterface | null>(null)
// 默认设置为当前在加载中
const loading = ref(true)
onMounted(() => {
  // 容器加载后实例化编辑器引擎
  if (container.value) {
    //实例化引擎
    const engineInstance = new Engine(container.value, {
      // 启用的插件
      plugins,
      // 启用的卡片
      cards,
      // 所有的卡片配置
      config: pluginConfig,
    })
    // 设置显示成功消息UI，默认使用 console.log
    engineInstance.messageSuccess = (msg: string) => {
      message.success(msg)
    }
    // 设置显示错误消息UI，默认使用 console.error
    engineInstance.messageError = (error: string) => {
      message.error(error)
    }
    // 设置显示确认消息UI，默认无
    engineInstance.messageConfirm = (msg: string) => {
      return new Promise<boolean>((resolve, reject) => {
        Modal.confirm({
          content: msg,
          onOk: () => resolve(true),
          onCancel: () => reject(),
        })
      })
    }
    //卡片最大化时设置编辑页面样式
    engineInstance.on('card:maximize', () => {
      $('.editor-toolbar').css('z-index', '9999').css('top', '55px')
    })
    engineInstance.on('card:minimize', () => {
      $('.editor-toolbar').css('z-index', '').css('top', '')
    })
    // 默认编辑器值，为了演示，这里初始化值写死，正式环境可以请求api加载

    const value = demoContent
    // 使用协同编辑，需要安装 mongodb 数据库，并且配置 ot-server/client 中的数据库连接，最后 yarn start 启动 ot-server 服务

    // 非协同编辑，设置编辑器值，异步渲染后回调
    engineInstance.setValue(value, () => {
      loading.value = false
    })

    // 监听编辑器值改变事件
    engineInstance.on('change', () => {
      console.log('value', engineInstance.getJsonValue())
      console.log('html:', engineInstance.getHtml())
    })

    engine.value = engineInstance
  }
})

onUnmounted(() => {
  if (engine.value) engine.value.destroy()
})
</script>
<style>
#app {
  padding: 0;
}
#nav {
  position: relative;
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
  height: 100vh;
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
  min-height: calc(100vh - 68px);
  border: 0 none;
}

.editor-content .am-engine {
  padding: 40px 60px 60px;
}

.editor-mobile .editor-content .am-engine {
  padding: 18px 0 0 0;
}
</style>
