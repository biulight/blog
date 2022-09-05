---
title: 小程序与h5通信实现方案
authors: biulight
tags: [Weixin Mini Program]
---

在微信小程序中，如何实现原生页面与webview内嵌的h5页面双向通信？

<!--truncate-->

<!-- # 小程序内嵌h5与native通信实现 -->


## 背景

微信小程序提供的 `message`只能在特定的场景触发

## 内嵌h5在小程序中的交互（跳转）场景

- h5 跳转小程序 native 页面
- 小程序 native 页面返回 webview 页面

## 内嵌h5跳转h5的方式

常见的h5跳转h5方式

1. 直接用 `location.href` 跳转
2. 通过路由hash跳转，触发 `hashchange` ,页面不刷新， js 层面重新渲染
3. 跳转页面打开一个新的 `webview` ，相当于每个页面都是一个独立的 `webview`


## 跨页面通信的实现

### 实现的条件

:::tip

url链接 `hash` 变化，不会重新加载页面

:::

- 小程序通过 `hash`传参给 `webview` 页面
- h5通过 `hashchange` 捕获最新的参数，进行自定义逻辑处理
- h5通过 `window.history.go(-1)` 去掉传参的路由栈

### 方案缺点

**需要h5和小程序同步改造**

### 基础版实现

### 中级版实现

### 终极版本实现
