---
title: SSH登录多个github账户
authors: biulight
tags: [git, ssh, github]
---

在同一台电脑上，如何配置多个SSH Key？
<!--truncate-->

<!-- # 同一个电脑用户ssh同时使用多个github账户 -->

## 背景

通常，我们只会生成一个SSH Key（id_rsa）,然后提交到多个不同的网站(如：github, gitee, 服务器);
但是也存在另外一种需要，我们在同一个网站上，注册了多个用户。**通常网站不允许为多个用户名配置同一个SSH Key**，此时就给用户造成些许麻烦。

如下图，就是github网站，往多个账号添加同一个SSH Key报错提示。
![github alt already use](/img/blog/1660984652088.jpg)

重点来了，怎样配置多个SSH Key呢？下面就以我自身为例，给出解决方案。

## 解决方案

我当前已配置了一个SSH Key，已关联了多个网站，怕麻烦的我，并不想修改它，我继续把它当做默认的SSH Key。
此时我只需要增加一个新的SSH Key,关联到新的github账户

:::tip
多个github账户的配置方案跟下述的方案没有太大的差异，所以只要学会加法，就很容易了。
:::

### 准备工作

- 准备一个新的github账号(biulight)

- bash/zsh环境

### 配置

**以Mac/Linux为例**

1. 打开终端，生成新的SSH Key
```bash
cd ~/.ssh
ssh-keygen -m PEM -t rsa -b 4096 -f biulight -C "biulight007@gmail.com"
```

:::tip
1. 上述命令会在当前目录下生成两个文件biulight, biulight.pub , 因此一般会选择在 `~/.ssh` 目录下
2. 后缀`.pub`的文件为公钥文件，没有后缀的为私钥文件。
3. 可以通过 `ssh-keygen --help` 查看对应命令信息。
:::

2. 把biulight.pub里面的内容复制到新准备的github账户（biulight）中对应的位置

3. 再次打开终端，编辑 `~/.ssh/config` 文件

在该文件中新增以下内容
```bash
# biulight登录信息
Host biulight # 别名（可以随便起）
HostName github.com # 访问的真实地址
PreferredAuthentications publickey # 配置登录用什么权限验证
IdentityFile ~/.ssh/biulight  # 私钥文件(证书所在的位置)
```

关键在于Host与HostName的区别：
- HostName: 填写真实的服务地址（如：访问github，填写github.com）
- Host: 填写别名，后续会用上（如：通过ssh拉取github代码）

:::tip
`~/.ssh/config`文件其他配置信息:
- UserName 登录的用户名(如：git, root)
- Port 服务器open-ssh端口（默认：22，默认时，一般不写此行）
:::

4. 拉取代码

通常我们在Web页面上复制的SSH URL，可以直接使用，例如：
```bash
git clone git@github.com:biulight/blog.git
```
**但是**，由于现在使用的biulight的秘钥，因此需要修改原有的URL
```bash
# 用上面配置的HostName替换链接中的 `github.com`
git clone git@biulight:biulight/blog.git
```

### 总结

此时，就可以通过git ssh玩转多个github账户了

## 其他

如果想要进一步区分每个账户提交，可以为仓库设置局部的用户名和邮箱
```bash
# 取消全局 用户名/邮箱 配置
git config --global --unset user.name
git config --global --unset user.email

# 单独为每个repo设置 用户名/邮箱
git config user.name "xxx01"
git config user.email "xxx01@gmail.com"
```

