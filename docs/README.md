# 《朕的一生》资料总览

本仓库当前只保留《朕的一生》相关文档与美术资源。旧版都市生存、MUD runtime、测试脚本、像素素材和发布代码已清理。

## 当前内容

- `docs/art/sbti-lowpoly-style-guide.md`
  - SBTI-lowpoly 美术风格基线
  - 角色、背景、图标提示词模板
  - 负面提示词、尺寸规范、命名规范、验收标准
- `docs/art/asset-quality-review.md`
  - 当前 MVP 图片资源审查结论
  - 记录二次重生的图标、结局图、分享图和透明 HUD 图标
- `public/assets/chinese-reigns/reference/`
  - 风格锁定图与 SBTI testing 参考图
- `public/assets/chinese-reigns/portraits/`
  - 首批角色头像资源
- `public/assets/chinese-reigns/backgrounds/`
  - 首批场景背景资源
- `public/assets/chinese-reigns/icons/`
  - 四项核心数值资源图标：民心、国库、兵权、朝政
  - `*.png` 为不透明插画版，适合教程/说明/结果页
  - `*-transparent.png` 为透明 HUD 版，适合顶部资源条和卡片内叠加
- `public/assets/chinese-reigns/endings/`
  - 首批结局结果页插画
- `public/assets/chinese-reigns/share/`
  - 人格测试式分享页背景

## 美术基线

当前风格固定为：

- SBTI testing 风格的人格测试头像感
- 低饱和几何 cutout illustration
- 可见低多边形折面体积
- 大头、小身体、略笨拙的幽默姿态
- 古代宫廷元素只作为轻量符号
- 图片内不烘焙中文、英文、按钮文案、Logo 或水印

完整规范见：`docs/art/sbti-lowpoly-style-guide.md`。
