# 听见文字

Elvin 的个人非商业听读空间。固定入口：https://elvinnnnnwu.github.io/elvin-reading-room/

## v0.4.0（2026-10-29）

《毛泽东选集》第一至四卷，160条官方朗读，160份正文与同步字幕。所有篇目提供手机省流 AAC，保留官网原声音源；支持点句跳播、目录搜索、倍速、标记、原版书页阅读和进度导入/导出。

正文和字幕继承已审计的源码交接，保留文字差异说明、原书特殊字形及未朗读句子。云端交付逐文件核对交接版本、字幕篇目与时间范围，不把交接审计当作新一轮全篇人工校对。机器定位和抽查不等于整套逐句人工复听。

- `v2-009` 的“这是常识中包含的真理。”与 `v2-034` 的“以便使我们陷于孤立。”保留为原书文字，明确标注当前录音未读，不提供虚构跳播时间。
- `v1-002` 的两处未朗读括注保留说明；两处特殊字形使用原版页图显示。
- 不包括第五卷及其他著作。原书注释与版式请切换原版阅读。

## 音频与验证

省流音频在云端从目录中的精确官方地址重新生成：单声道 AAC、24kHz、32kbps、faststart，不剪辑、不变速。每条原文件的完整长度与 SHA256 必须匹配交接记录；原声与 AAC 均完整解码为 PCM 计算时长，差值小于0.16秒，并比较开篇、25%、60%和近结尾四处波形，允许10ms相位偏移，相关度至少0.88。

`source/public/audio/mobile-audio-source.json` 记录本次云端媒体的真实哈希、字节数、时长和抽查结果。`cloud-handoff-audit.json` 保留原本机候选审计作为历史参考；编码器版本不同，AAC 哈希可以不同，不冒用历史文件哈希。`cloud-release-audit.json` 是最终全量发布包检查结果。

移动视口 Chromium 检查覆盖真实 AAC 播放、点句跳播、刷新续听、原版阅读控件、特殊字形、未朗读句子不可跳播、网络失败后的重试和双向音源切换。网络失败使用受控响应；切换测试的原声响应实现 Range，并使用已核验原文件。安卓/微信实体机、蓝牙、锁屏、导航或来电打断仍需实体机验收。

## 使用与兼容

用同一个浏览器和网址打开，点目录选择篇目，再点播放。播放首次需要用户操作；官方书页和音频需要网络，第三方服务变化可能影响访问。

收听秒数、标记、阅读位置与偏好保存在当前浏览器，存储键仍为 `elvin-reading-library-v2`、schema 2，篇目 ID 保持不变。更换设备、浏览器或清除网站数据前请导出进度。旧音频、旧字幕及旧的带哈希脚本/CSS保留，已打开的旧页面不会被强制刷新。验收时用 `?preview=1` 隔离个人进度，正常使用不带此参数。

## 云端维护

`source/` 为工程，`docs/` 为 main 分支的 GitHub Pages 发布目录。环境已验证 Node 24、pnpm 11、ffmpeg 7.1 和 Python 3.12（媒体工具需要 NumPy）。

```sh
cd /workspace/elvin-reading-room/source
pnpm install --frozen-lockfile --store-dir /workspace/.pnpm-store
pnpm run dev
# 开发端口5199；开发媒体链接指向 ../docs/audio/mobile
node scripts/verify-progress.cjs
pnpm run build
```

浏览器回归需要 Playwright 和 Chromium：

```sh
PLAYWRIGHT_MODULE=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node scripts/verify-browser.cjs
PLAYWRIGHT_MODULE=/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright node scripts/verify-retry.cjs
```

只在确实需要重制媒体时运行 `python3 source/scripts/cloud-media.py`，不要重新识别整套音频。工具使用 `/workspace/elvin-media-cache` 的可恢复缓存；缓存、PCM和官方原文件不提交。字幕不因编码器不同而重写。构建完成后将 `source/dist/` 合并到 `docs/`，不要使用会删除旧资源的同步选项；更新版本说明，再运行 `python3 source/scripts/verify-release.py`。发布目录须小于1,000,000,000字节，单文件小于100MB。发布后的公开站点验证须另行执行，构建通过不代表部署已完成。

本次接续全部在云端执行，不创建定时自动化。

## 来源与权利

音频：[共产党员网有声书](https://www.12371.cn/special/mzdxj/dyj/)，页面含其他卷入口。原版书页：[理论中国电子书](https://www.theorychina.org.cn/llzgxs/lxzz_894/mzd/)。第一篇正文：[共产党员网同篇原文](https://www.12371.cn/2012/11/19/ARTI1353313414202316.shtml)。

共产党员网[转载说明](https://www.12371.cn/gjgx/)要求注明来源、准确转载、不得商用。本工具仅供个人非商业学习，保留来源和各篇差异说明。第三方著作、书页与录音的权利归相应权利人，未将其声明为开源素材；未打包传播整套页图。

不含账户、跟踪分析、私人进度、个人知识库、原始转写、模型或下载缓存。
