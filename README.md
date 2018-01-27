# 命令助手
## 简介
一个支持对Minecraft(基岩版)的命令进行补全与辅助输入的Android+Rhino脚本。

目前已经支持多个Android的Rhino脚本平台：
* caDroid
* Auto.js
* CreateJS
* 任何允许ModPE脚本加载的Minecraft(基岩版/PE)启动器

另有[命令助手Android版](https://gitee.com/projectxero/cadroid)允许脚本直接在Android下运行，并增强了命令助手的功能。

### 特性
* 支持命令的智能补全与纠错
* 支持命令在线帮助
* 加入了已汉化的ID表
* （部分平台支持）一键粘贴命令
* 支持历史命令与命令收藏夹
* 支持外加命令库来加入支持更多的功能或命令补全
* 支持更换主题样式

### 用法
* caDroid - 直接安装运行
* Auto.js - 从文件管理器打开选择“运行脚本”
* 启动器 - 导入该脚本

### 信息
* 宣传片： [bilibili:av14938870](http://www.bilibili.com/video/av14938870)
* [正式版下载链接](http://pan.baidu.com/share/link?shareid=2966673396&uk=404195919)

## 编译步骤
1. 创建一个副本并将副本代码中的 `{DATE}` 替换为当前日期，格式为 `yyyy-mm-dd` 。
2. 其次将代码中的 `{HELP}` 替换为[帮助.html](https://gitee.com/projectxero/ca/blob/master/%E5%B8%AE%E5%8A%A9.html)的内容。
3. 删除代码中所有在 `"IGNORELN_START";` 与 `"IGNORELN_END";` 的换行符及两侧的空白字符。
4. （可选）运行GModuleOrganize.js，整理G模块。
5. （可选）对代码进行压缩编码，GZIP+base64，自解压脚本需在开头加上 `"ui";` 。运行时自动解码解压。





