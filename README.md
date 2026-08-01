# Botw-Savediter

《塞尔达传说：旷野之息》中文桌面存档修改器，支持 Eden、Switch 和 Wii U 版 `game_data.sav`。

## 项目来源

- 本项目基于 [kailous/Botw-Savediter](https://github.com/kailous/Botw-Savediter) 继续开发，保留原中文界面、翻译和数据资源。
- 存档格式解析基于 [MarcRobledo/savegame-editors](https://github.com/MarcRobledo/savegame-editors/tree/master/zelda-botw)，按 MIT License 使用。
- 当前维护仓库：[Xunzi229/Botw-Savediter](https://github.com/Xunzi229/Botw-Savediter)。

## v2.0.0 变更

- 重构 Electron 桌面外壳，升级至 Electron 43，启用上下文隔离和沙箱。
- 自动发现 Eden 的 0-5 号存档槽，显示截图和常用角色参数。
- 保存最近使用的 8 个目录，支持快速切换和移除失效记录。
- 存档槽按最后更新时间倒序排列，并显示所属目录。
- 支持 BOTW v1.8 Switch 存档和常见 Mod 存档。
- 支持直接写回存档、保存前自动备份及历史备份恢复。
- 增加角色数值最大化、分类数量/耐久最大化和物品搜索。
- 修复顶部工具栏覆盖编辑选项的问题，优化中文桌面界面。
- 收紧本地文件写入范围，增加格式校验、临时文件和失败回滚保护。

## 功能

- 自动发现 Eden 的 0-5 号存档槽，并显示游戏截图、卢比、生命、精力和游戏时间。
- 本地记录最近使用的 8 个存档目录，启动后可快速切换或移除失效记录。
- 修改卢比、怪币、生命、精力、英杰之力、坐标、地图和首领计数。
- 编辑武器、弓、盾、防具、材料、料理和重要物品。
- 修改物品数量、耐久、词条及词条数值，支持添加、删除和批量修改。
- 编辑马匹、地图图钉、克洛格、图鉴、地点及 2000 多项高级游戏标志。
- 支持 v1.0-v1.8、Switch/Wii U 大小端存档及常见 Mod 存档。
- 原地保存前自动备份，支持查看并一键恢复历史备份。

## 使用

1. 完全关闭游戏和 Eden，避免存档被同时写入。
2. 运行修改器，直接选择自动发现的存档槽。
3. 修改参数后点击“保存存档”。
4. 如需回退，点击“备份记录”并选择要恢复的版本。

备份位于游戏存档目录下的 `.botw-save-editor-backups`。也可以使用“打开单个存档”编辑其他位置的 `game_data.sav`。

## 开发

```powershell
npm install
npm start
```

构建 Windows x64 版本：

```powershell
npm run package-win
```

构建结果位于 `dist/Botw-Save-Editor-win32-x64`。

## 安全设计

- 仅允许写入修改器已发现或用户明确选择的 `game_data.sav`。
- 写入前校验存档大小、版本标头和数据完整性。
- 每次保存和恢复前创建时间戳备份。
- 通过临时文件及回滚文件替换，写入失败时恢复原存档。
- Electron 启用上下文隔离、沙箱并禁用 Node.js 渲染层访问。

完整授权信息见 [LICENSE](LICENSE)。
