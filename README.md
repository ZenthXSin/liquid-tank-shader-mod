# 液体罐着色器 (liquid-tank-shader-mod)

让 Mindustry 的液体罐（`liquid-tank` / `liquid-container` / `reinforced-liquid-container`）里的液面拥有原版液体着色器效果——水会流动、冷液会翻腾、岩浆会灼烧，不再只是单调的平涂色块。

![Mindustry](https://img.shields.io/badge/Mindustry-v159.7-4a5568) ![License](https://img.shields.io/badge/License-GPL--3.0-blue)

## 效果

| 液体 | 效果 |
| --- | --- |
| 水 (water) | 蓝色调 + 正弦波浪亮度调制，液面缓慢起伏 |
| 岩浆 (slag) | 噪声驱动双色调色块，暗红灼烧翻涌 |
| 冷液 (cryofluid) | 噪声 + 波纹亮带，冰蓝冷光 |
| 沥青 (tar) | 噪声暗色调制，粘稠污浊 |
| 泥浆 (mud) | 噪声亮度闪烁，浑浊翻泡 |
| 绿液 (arkycite) | 噪声阈值替换为三段绿色，植被般流动 |

所有效果都使用**世界坐标**驱动，因此液面纹理跨罐体连续、不随相机缩放走样，动画随游戏时间推进。

## 工作原理

原版 `LiquidBlock.drawTiledFrames` 只能画平涂液面；本模组：

1. 挂钩所有 `LiquidRouter` 且 `size >= 2` 的方块，替换其 `buildType`；
2. 自定义顶点着色器 `tank-liquid.vert` 通过 `a_position.xy` 传递世界坐标 `v_worldPos`；
3. 片元着色器 `tank-liquid.frag` 用世界坐标直接采样 `sprites/noise.png` 噪声贴图 + `sin` 波浪，输出原版风格的液体动画；
4. 关键点：`Draw.shader()` 会先 flush 再切换着色器，因此 shader 的绑定与液面绘制必须在同一个 `Draw.draw(z, Runnable)` 内完成，避免图集 UV 偏移导致跨贴图采样走样。

## 构建

```bash
./gradlew jar
# 产物: build/libs/liquid-tank-shader-mod.jar
```

要求 JDK 17+ 与 Mindustry v154+（在 v159.7 上验证）。

## 安装

- **命令行**: `game` → `Mods` → `Open Folder`，放入 jar 后重启
- **Steam**: 订阅 `https://github.com/ZenthXSin/liquid-tank-shader-mod/releases` 的 jar 至 `%APPDATA%/../Local/Mindustry/mods/`
- **手机上**: 将 jar 放入 `Mindustry/mods/`

## 兼容性

- 纯客户端着色器，不影响存档与多人协议
- 仅替换液体罐液面绘制，不改变容量/物流逻辑
- 不依赖其他模组

## 许可证

GPL-3.0