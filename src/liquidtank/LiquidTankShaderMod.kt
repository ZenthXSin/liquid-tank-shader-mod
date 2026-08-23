package liquidtank

import arc.graphics.g2d.Draw
import arc.func.Cons
import arc.func.Prov
import arc.util.Log
import mindustry.Vars
import mindustry.gen.Building
import mindustry.mod.Mod
import mindustry.type.Liquid
import mindustry.world.Block
import mindustry.world.blocks.liquid.LiquidBlock
import mindustry.world.blocks.liquid.LiquidRouter

/**
 * 液体罐着色器模组。
 *
 * 把原版液面着色器（water/slag/cryofluid/tar/mud/arkycite）的效果
 * 应用到 liquid-tank / liquid-container 等液体罐方块上。
 */
class LiquidTankShaderMod : Mod() {

    override fun init() {
        Log.info("[LiquidTankShaderMod] init")

        // 初始化着色器（客户端 GL 上下文可用）
        LiquidTankShaders.init()

        // 挂钩 liquid-tank / liquid-container / reinforced 液体罐方块
        // 注意：Android 不支持 lambda，必须用匿名类
        Vars.content.blocks().each(object : Cons<Block> {
            override fun get(block: Block) {
                if (block is LiquidRouter && block.size >= 2) {
                    block.buildType = object : Prov<Building> {
                        override fun get(): Building {
                            return ShaderLiquidTankBuild(block as LiquidRouter)
                        }
                    }
                    Log.info("[LiquidTankShaderMod] 已挂钩 " + block.name)
                }
            }
        })

        Log.info("[LiquidTankShaderMod] 就绪")
    }
}

/**
 * 自定义 Building：液体罐。
 * 逻辑复刻 LiquidRouter.LiquidRouterBuild，仅液面绘制套上着色器。
 */
class ShaderLiquidTankBuild(router: LiquidRouter) : Building() {

    init {
        block = router
    }

    override fun updateTile() {
        dumpLiquid(liquids.current())
    }

    override fun acceptLiquid(source: Building, liquid: Liquid): Boolean {
        return liquids.current() === liquid || liquids.currentAmount() < 0.2f
    }

    override fun draw() {
        val router = block as LiquidRouter

        // 底部
        Draw.rect(router.bottomRegion, x, y)

        // 液面（带着色器）
        // 关键：Draw.shader() 内部会先 flush() 再改 customShader，
        // 所以 shader 设置和液面绘制必须在同一个 runnable 里，
        // 在 Draw.flush() 的排序循环中执行：
        //   preDraw → flush(默认shader) → setShader(tank)
        //   drawTiledFrames → 液面顶点入 buffer（customShader=tank）
        //   postDraw → flush(tankShader 渲染液面) → setShader(null)
        if (liquids.currentAmount() > 0.001f) {
            Draw.draw(Draw.z(), object : Runnable {
                override fun run() {
                    LiquidTankShaders.preDraw(x, y, block.size, liquids.current())
                    LiquidBlock.drawTiledFrames(
                        block.size, x, y, router.liquidPadding,
                        liquids.current(), liquids.currentAmount() / block.liquidCapacity
                    )
                    LiquidTankShaders.postDraw()
                }
            })
        }

        // 顶部
        Draw.rect(router.region, x, y)
    }
}