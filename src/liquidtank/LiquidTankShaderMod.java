package liquidtank;

import arc.graphics.g2d.Draw;
import arc.func.Cons;
import arc.func.Prov;
import arc.util.Log;
import mindustry.Vars;
import mindustry.gen.Building;
import mindustry.mod.Mod;
import mindustry.type.Liquid;
import mindustry.world.Block;
import mindustry.world.blocks.liquid.LiquidBlock;
import mindustry.world.blocks.liquid.LiquidRouter;

/**
 * 液体罐着色器模组。
 *
 * 把原版液面着色器（water/slag/cryofluid/tar/mud/arkycite）的效果
 * 应用到 liquid-tank / liquid-container 等液体罐方块上。
 */
public class LiquidTankShaderMod extends Mod {

    @Override
    public void init() {
        Log.info("[LiquidTankShaderMod] init");

        // 初始化着色器（客户端 GL 上下文可用）
        LiquidTankShaders.init();

        // 挂钩 liquid-tank / liquid-container / reinforced 液体罐方块
        // 注意：Android 不支持 lambda，必须用匿名类
        Vars.content.blocks().each(new Cons<Block>() {
            @Override
            public void get(Block block) {
                if (block instanceof LiquidRouter && block.size >= 2) {
                    block.buildType = new Prov<Building>() {
                        @Override
                        public Building get() {
                            return new ShaderLiquidTankBuild((LiquidRouter) block);
                        }
                    };
                    Log.info("[LiquidTankShaderMod] 已挂钩 " + block.name);
                }
            }
        });

        Log.info("[LiquidTankShaderMod] 就绪");
    }
}

/**
 * 自定义 Building：液体罐。
 * 逻辑复刻 LiquidRouter.LiquidRouterBuild，仅液面绘制套上着色器。
 */
class ShaderLiquidTankBuild extends Building {

    public ShaderLiquidTankBuild(LiquidRouter router) {
        block = router;
    }

    @Override
    public void updateTile() {
        dumpLiquid(liquids.current());
    }

    @Override
    public boolean acceptLiquid(Building source, Liquid liquid) {
        return (liquids.current() == liquid || liquids.currentAmount() < 0.2f);
    }

    @Override
    public void draw() {
        LiquidRouter router = (LiquidRouter) block;

        // 底部
        Draw.rect(router.bottomRegion, x, y);

        // 液面（带着色器）
        // 关键：Draw.shader() 内部会先 flush() 再改 customShader，
        // 所以 shader 设置和液面绘制必须在同一个 runnable 里，
        // 在 Draw.flush() 的排序循环中执行：
        //   preDraw → flush(默认shader) → setShader(tank)
        //   drawTiledFrames → 液面顶点入 buffer（customShader=tank）
        //   postDraw → flush(tankShader 渲染液面) → setShader(null)
        if (liquids.currentAmount() > 0.001f) {
            Draw.draw(Draw.z(), new Runnable() {
                @Override
                public void run() {
                    LiquidTankShaders.preDraw(x, y, block.size, liquids.current());
                    LiquidBlock.drawTiledFrames(
                        block.size, x, y, router.liquidPadding,
                        liquids.current(), liquids.currentAmount() / block.liquidCapacity
                    );
                    LiquidTankShaders.postDraw();
                }
            });
        }

        // 顶部
        Draw.rect(router.region, x, y);
    }
}