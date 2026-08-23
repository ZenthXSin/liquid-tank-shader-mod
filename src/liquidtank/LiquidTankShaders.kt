package liquidtank

import arc.Core
import arc.graphics.g2d.Draw
import arc.graphics.gl.Shader
import arc.util.Log
import arc.util.Time
import mindustry.Vars
import mindustry.type.Liquid
import mindustry.world.Block
import mindustry.world.blocks.liquid.LiquidRouter

/**
 * 液体罐着色器。
 *
 * 自定义顶点着色器 tank-liquid.vert 通过 v_worldPos 传递世界坐标，
 * 片元着色器直接用世界坐标驱动噪声采样，仅做颜色调制不做 UV 偏移。
 */
object LiquidTankShaders {
    var tankShader: Shader? = null

    var curLiquidType: Int = 0

    /**
     * 液体类型 → 效果索引: 0=water, 1=slag, 2=cryofluid, 3=tar, 4=mud, 5=arkycite, 6=neoplasm, 7=oil
     */
    fun liquidTypeIndex(liquid: Liquid): Int {
        val name = liquid.name
        return when {
            name.contains("slag") -> 1
            name.contains("cryofluid") -> 2
            name.contains("tar") -> 3
            name.contains("mud") -> 4
            name.contains("arkycite") -> 5
            name.contains("neoplasm") -> 6
            name.contains("oil") -> 7
            else -> 0 // water 风格
        }
    }

    fun init() {
        try {
            val vertFi = Vars.mods.getMod(LiquidTankShaderMod::class.java).root.child("shaders").child("tank-liquid.vert")
            var fragFi: arc.files.Fi? = null
            try {
                fragFi = Vars.mods.getMod(LiquidTankShaderMod::class.java).root.child("shaders").child("tank-liquid.frag")
            } catch (_: Exception) {
            }
            if (fragFi == null || !fragFi.exists()) {
                Log.err("[LiquidTankShaders] 找不到 tank-liquid.frag")
                return
            }

            tankShader = object : Shader(vertFi, fragFi) {
                override fun apply() {
                    try {
                        setUniformf("u_time", Time.time)
                        setUniformi("u_liquidType", curLiquidType)

                        if (hasUniform("u_noise")) {
                            arc.graphics.Gl.activeTexture(arc.graphics.Gl.texture1)
                            try {
                                val noise = Core.assets.get("sprites/noise.png", arc.graphics.Texture::class.java)
                                if (noise != null) noise.bind()
                            } catch (_: Exception) {
                            }
                            setUniformi("u_noise", 1)
                            arc.graphics.Gl.activeTexture(arc.graphics.Gl.texture0)
                        }
                    } catch (_: Throwable) {
                    }
                }
            }

            tankShader!!.bind()
            Log.info("[LiquidTankShaders] tank-liquid shader 编译成功")
        } catch (t: Throwable) {
            Log.err("[LiquidTankShaders] shader 加载失败: " + t.message)
            t.printStackTrace()
        }
    }

    /** 在 drawTiledFrames 前设置 shader 和 uniform */
    fun preDraw(x: Float, y: Float, blockSize: Int, liquid: Liquid) {
        if (tankShader == null) return
        curLiquidType = liquidTypeIndex(liquid)
        Draw.shader(tankShader)
    }

    /** 解除 shader */
    fun postDraw() {
        if (tankShader != null) Draw.shader()
    }

    /** 判断是否为液体罐（LiquidRouter 且 size>=2） */
    fun isLiquidTank(block: Block): Boolean {
        return block is LiquidRouter && block.size >= 2
    }
}