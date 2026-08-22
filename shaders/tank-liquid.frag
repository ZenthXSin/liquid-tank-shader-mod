#define HIGHP

uniform sampler2D u_texture;
uniform sampler2D u_noise;

uniform float u_time;
uniform int u_liquidType;

varying vec4 v_color;
varying vec2 v_texCoords;
varying vec2 v_worldPos;

// 原版各液体颜色（必须加括号）
#define S2_SLAG (vec3(100.0, 93.0, 49.0) / 100.0)
#define S1_SLAG (vec3(100.0, 60.0, 25.0) / 100.0)
#define S1_CRYO (vec3(53.0, 83.0, 93.0) / 100.0)
#define S2_CRYO (vec3(68.0, 90.0, 97.0) / 100.0)
#define S1_ARKY (vec4(96.0, 131.0, 66.0, 255.0) / 255.0)
#define S2_ARKY (vec3(132.0, 169.0, 79.0) / 255.0)
#define S3_ARKY (vec3(210.0, 221.0, 118.0) / 255.0)

void main(){
    vec4 base = texture2D(u_texture, v_texCoords);
    // 用顶点颜色（来自 Drawf.liquid 的液体颜色）给贴图上色
    vec4 tinted = base * v_color;
    vec2 worldPos = v_worldPos;

    float btime = u_time / 5000.0;

    // === 水（water）：蓝色调 + 波浪调制 ===
    if(u_liquidType == 0){
        float stime = u_time / 5.0;

        // 在原版色调基础上叠加蓝色调
        vec3 color = tinted.rgb * vec3(0.9, 0.9, 1.0);

        float tester = mod((worldPos.x + worldPos.y*1.1 + sin(stime / 8.0 + worldPos.x/5.0 - worldPos.y/100.0)*2.0) +
                               sin(stime / 20.0 + worldPos.y/3.0) * 1.0 +
                               sin(stime / 10.0 - worldPos.y/2.0) * 2.0 +
                               sin(stime / 7.0 + worldPos.y/1.0) * 0.5 +
                               sin(worldPos.x / 3.0 + worldPos.y / 2.0) +
                               sin(stime / 20.0 + worldPos.x/4.0) * 1.0, 40.0);

        // 增强波浪亮度调制
        if(tester < 7.0){
            color *= 1.3;
        }else if(tester < 14.0){
            color *= 1.1;
        }

        gl_FragColor = vec4(color.rgb, tinted.a);

    // === 岩浆（slag）：噪声驱动的纯色替换 ===
    }else if(u_liquidType == 1){
        float noise = (texture2D(u_noise, worldPos / (200.0 / 2.0) + vec2(btime) * vec2(-0.9, 0.8)).r +
                       texture2D(u_noise, worldPos / (200.0 / 2.0) + vec2(btime * 1.1) * vec2(0.8, -1.0)).r) / 2.0;

        vec4 color = tinted;

        if(noise > 0.6){
            color.rgb = S2_SLAG;
        }else if(noise > 0.54){
            color.rgb = S1_SLAG;
        }

        gl_FragColor = color;

    // === 冷液（cryofluid）：噪声驱动的颜色替换 ===
    }else if(u_liquidType == 2){
        float noise = (texture2D(u_noise, worldPos / (100.0 / 2.0) + vec2(btime) * vec2(-0.2, 0.8)).r +
                       texture2D(u_noise, worldPos / (100.0 / 2.0) + vec2(btime * 1.1) * vec2(0.8, -1.0)).r) / 2.0;

        float wave = abs(sin(worldPos.x * 1.1 + worldPos.y) + 0.1 * sin(2.5 * worldPos.x) + 0.15 * sin(3.0 * worldPos.y)) / 30.0;

        if(noise + wave > 0.54 && noise + wave < 0.57){
            tinted.rgb = S2_CRYO;
        }else if(noise + wave > 0.49 && noise + wave < 0.62){
            tinted.rgb = S1_CRYO;
        }

        gl_FragColor = tinted;

    // === 沥青（tar）：暗色调制 ===
    }else if(u_liquidType == 3){
        float btime_tar = u_time / 8000.0;
        float noise = (texture2D(u_noise, worldPos / (180.0 / 2.0) + vec2(btime_tar) * vec2(-0.9, 0.8)).r +
                       texture2D(u_noise, worldPos / (180.0 / 2.0) + vec2(btime_tar * 1.1) * vec2(-0.8, -1.0)).r) / 2.0;

        if(!(noise > 0.54 && noise < 0.58)){
            tinted.rgb *= vec3(0.6, 0.6, 0.7);
        }

        gl_FragColor = tinted;

    // === 泥浆（mud）：亮度调制 ===
    }else if(u_liquidType == 4){
        float btime_mud = u_time / 70000.0;
        float noise = sin((texture2D(u_noise, worldPos / (180.0 / 2.0) + vec2(btime_mud) * vec2(-0.9, 0.8)).r +
                           texture2D(u_noise, worldPos / (180.0 / 2.0) + vec2(abs(sin(btime_mud)) * 1.1) * vec2(-0.8, -1.0)).r) / 2.0);

        if(noise > 0.54 && noise < 0.68){
            tinted.rgb *= vec3(1.4);
        }else if(!(noise > 0.40 && noise < 0.54)){
            tinted.rgb *= vec3(1.2);
        }

        gl_FragColor = tinted;

    // === 绿液（arkycite）：噪声 + 颜色替换 ===
    }else{
        float atime = u_time / 15000.0;
        float noise = (texture2D(u_noise, worldPos / (160.0 / 2.0) + vec2(atime) * vec2(-0.9, 0.8)).r +
                       texture2D(u_noise, worldPos / (160.0 / 2.0) + vec2(atime * 1.1) * vec2(0.8, -1.0)).r) / 2.0;
        noise = abs(noise - 0.5) * 7.0 + 0.23;

        vec4 color = tinted;

        if(noise > 0.85){
            if(color.g >= (S2_ARKY).g - 0.1){
                color.rgb = S3_ARKY;
            }else{
                color.rgb = S2_ARKY;
            }
        }else if(noise > 0.5){
            color.rgb = S2_ARKY;
        }

        gl_FragColor = vec4(max(S1_ARKY, color).rgb, tinted.a);
    }
}