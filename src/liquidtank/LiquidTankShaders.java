package liquidtank;

import arc.Core;
import arc.graphics.g2d.Draw;
import arc.graphics.g2d.TextureRegion;
import arc.graphics.gl.Shader;
import arc.util.Log;
import arc.util.Time;
import arc.util.Tmp;
import mindustry.Vars;
import mindustry.gen.Building;
import mindustry.graphics.Shaders;
import mindustry.type.Liquid;
import mindustry.world.Block;
import mindustry.world.blocks.liquid.LiquidBlock;
import mindustry.world.blocks.liquid.LiquidRouter;

/**
 * 液体罐着色器。
 *
 * 自定义顶点着色器 tank-liquid.vert 通过 v_worldPos 传递世界坐标，
 * 片元着色器直接用世界坐标驱动噪声采样，仅做颜色调制不做 UV 偏移。
 */
public class LiquidTankShaders {
    public static Shader tankShader;

    public static int curLiquidType;

    /**
     * 液体类型 → 效果索引: 0=water, 1=slag, 2=cryofluid, 3=tar, 4=mud, 5=arkycite
     */
    public static int liquidTypeIndex(Liquid liquid) {
        String name = liquid.name;
        if (name.contains("slag")) return 1;
        if (name.contains("cryofluid")) return 2;
        if (name.contains("tar")) return 3;
        if (name.contains("mud")) return 4;
        if (name.contains("arkycite")) return 5;
        return 0; // water 风格
    }

    public static void init() {
        try {
            arc.files.Fi vertFi = Vars.mods.getMod(LiquidTankShaderMod.class).root.child("shaders").child("tank-liquid.vert");
            arc.files.Fi fragFi = null;
            try {
                fragFi = Vars.mods.getMod(LiquidTankShaderMod.class).root.child("shaders").child("tank-liquid.frag");
            } catch (Exception ignored) {
            }
            if (fragFi == null || !fragFi.exists()) {
                Log.err("[LiquidTankShaders] 找不到 tank-liquid.frag");
                return;
            }

            tankShader = new Shader(vertFi, fragFi) {
                @Override
                public void apply() {
                    try {
                        setUniformf("u_time", Time.time);
                        setUniformi("u_liquidType", curLiquidType);

                        if (hasUniform("u_noise")) {
                            arc.graphics.Gl.activeTexture(arc.graphics.Gl.texture1);
                            try {
                                var noise = arc.Core.assets.get("sprites/noise.png", arc.graphics.Texture.class);
                                if (noise != null) noise.bind();
                            } catch (Exception ignored) {
                            }
                            setUniformi("u_noise", 1);
                            arc.graphics.Gl.activeTexture(arc.graphics.Gl.texture0);
                        }
                    } catch (Throwable t) {
                    }
                }
            };

            tankShader.bind();
            Log.info("[LiquidTankShaders] tank-liquid shader 编译成功");
        } catch (Throwable t) {
            Log.err("[LiquidTankShaders] shader 加载失败: " + t.getMessage());
            t.printStackTrace();
        }
    }

    /** 在 drawTiledFrames 前设置 shader 和 uniform */
    public static void preDraw(float x, float y, int blockSize, Liquid liquid) {
        if (tankShader == null) return;
        curLiquidType = liquidTypeIndex(liquid);
        Draw.shader(tankShader);
    }

    /** 解除 shader */
    public static void postDraw() {
        if (tankShader != null) Draw.shader();
    }

    /** 判断是否为液体罐（LiquidRouter 且 size>=2） */
    public static boolean isLiquidTank(Block block) {
        return block instanceof LiquidRouter && block.size >= 2;
    }
}