---
title: Install Docker
authors: biulight
tags: [docker, ubuntu, linux]
---

如何安装docker？
<!-- truncate -->

## Ubuntu

### Snap 安装

> Snap 是一种全新的软件包管理方式，它类似一个容器拥有一个应用程序所有的文件和库，各个应用程序之间完全独立。

```bash
snap install docker
snap start docker --enable # 启动 docker，并添加随机启动

snap services docker # 确认服务状态
service snap.docker.dockerd status # 确认服务详情

snap refresh docker # 更新 Snap 安装的 docker 服务

```

## 常见的问题

1. Got permission denied while trying to connect to the Docker daemon socket

```bash
sudo chmod 666 /var/run/dokcer.sock

```

2. Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/dokcer.sock:Get http://%2Fvar%2Fdocker.sock/v1.40/containers/json:dial unix /var/run/docker.sock:connect:permission denied

```bash
sudo usermod -aG docker ${USER}
```

3. Got permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock

```bash
sudo chmod 666 /var/run/docker.sock
```
