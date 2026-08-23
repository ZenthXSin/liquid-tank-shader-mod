#define HIGHP

uniform sampler2D u_texture;
uniform sampler2D u_noise;

uniform vec2 u_campos;
uniform vec2 u_resolution;
uniform float u_time;
uniform int u_liquidType;

varying vec4 v_color;
varying vec2 v_texCoords;

// ===== 原版颜色，直接复制自 core/assets/shaders/*.frag =====
// slag.frag
#define S1_SLAG vec3(100.0, 60.0, 25.0) / 100.0
#define S2_SLAG vec3(100.0, 93.0, 49.0) / 100.0
// cryofluid.frag
#define S1_CRYO vec3(53.0, 83.0, 93.0) / 100.0
#define S2_CRYO vec3(68.0, 90.0, 97.0) / 100.0
// arkycite.frag
#define S1_ARKY vec4(96.0, 131.0, 66.0, 255.0) / 255.0
#define S2_ARKY vec3(132.0, 169.0, 79.0) / 255.0
#define S3_ARKY vec3(210.0, 221.0, 118.0) / 255.0

void main(){
    vec2 c = v_texCoords;
    // 罐内流体帧是灰白贴图，乘顶点色（液体颜色 + 液体量 alpha）获得原版地面液体的颜色
    vec4 tinted = texture2D(u_texture, c) * v_color;

    // === water（原版 water.frag 直接复制） ===
    if(u_liquidType == 0){
        vec2 v = vec2(1.0/u_resolution.x, 1.0/u_resolution.y);
        vec2 coords = vec2(c.x / v.x + u_campos.x, c.y / v.y + u_campos.y);

        float stime = u_time / 5.0;

        vec4 sampled = texture2D(u_texture, c + vec2(sin(stime/3.0 + coords.y/0.75) * v.x, 0.0)) * v_color;
        vec3 color = sampled.rgb * vec3(0.9, 0.9, 1);

        float tester = mod((coords.x + coords.y*1.1 + sin(stime / 8.0 + coords.x/5.0 - coords.y/100.0)*2.0) +
                               sin(stime / 20.0 + coords.y/3.0) * 1.0 +
                               sin(stime / 10.0 - coords.y/2.0) * 2.0 +
                               sin(stime / 7.0 + coords.y/1.0) * 0.5 +
                               sin(coords.x / 3.0 + coords.y / 2.0) +
                               sin(stime / 20.0 + coords.x/4.0) * 1.0, 40.0);

        if(tester < 7.0){
            color *= 1.2;
        }

        gl_FragColor = vec4(color.rgb, min(sampled.a * 100.0, 1.0));

    // === slag（原版 slag.frag 直接复制） ===
    }else if(u_liquidType == 1){
        vec2 coords = v_texCoords * u_resolution + u_campos;

        float btime = u_time / 5000.0;
        vec4 orig = tinted;
        float noise = (texture2D(u_noise, (coords) / (200.0 / 2.0) + vec2(btime) * vec2(-0.9, 0.8)).r + texture2D(u_noise, (coords) / (200.0 / 2.0) + vec2(btime * 1.1) * vec2(0.8, -1.0)).r) / 2.0;

        vec2 cs = v_texCoords + (vec2(
        texture2D(u_noise, (coords) / 170.0 + vec2(btime) * vec2(-0.9, 0.8)).r,
        texture2D(u_noise, (coords) / 170.0 + vec2(btime * 1.1) * vec2(0.8, -1.0)).r
        ) - vec2(0.5)) * 8.0 / u_resolution;

        vec4 color = texture2D(u_texture, cs) * v_color;
        if(color.a < 0.95){
            color = orig;
        }

        if(noise > 0.6){
            color.rgb = S2_SLAG;
        }else if(noise > 0.54){
            color.rgb = S1_SLAG;
        }

        gl_FragColor = color;

    // === cryofluid（原版 cryofluid.frag 直接复制） ===
    }else if(u_liquidType == 2){
        vec2 coords = vec2(c.x * u_resolution.x + u_campos.x, c.y * u_resolution.y + u_campos.y);

        float btime = u_time / 5000.0;
        float wave = abs(sin(coords.x * 1.1 + coords.y) + 0.1 * sin(2.5 * coords.x) + 0.15 * sin(3.0 * coords.y)) / 30.0;
        float noise = wave + (texture2D(u_noise, (coords) / (100.0 / 2.0) + vec2(btime) * vec2(-0.2, 0.8)).r + texture2D(u_noise, (coords) / (100.0 / 2.0) + vec2(btime * 1.1) * vec2(0.8, -1.0)).r) / 2.0;
        vec4 color = tinted;

        if(noise > 0.54 && noise < 0.57){
            color.rgb = S2_CRYO;
        }else if(noise > 0.49 && noise < 0.62){
            color.rgb = S1_CRYO;
        }

        gl_FragColor = color;

    // === tar（原版 tar.frag 直接复制） ===
    }else if(u_liquidType == 3){
        vec2 coords = vec2(c.x * u_resolution.x + u_campos.x, c.y * u_resolution.y + u_campos.y);

        float btime = u_time / 8000.0;
        float noise = (texture2D(u_noise, (coords) / (180.0 / 2.0) + vec2(btime) * vec2(-0.9, 0.8)).r + texture2D(u_noise, (coords) / (180.0 / 2.0) + vec2(btime * 1.1) * vec2(-0.8, -1.0)).r) / 2.0;
        vec4 color = tinted;

        if(!(noise > 0.54 && noise < 0.58)){
            color.rgb *= vec3(0.6, 0.6, 0.7);
        }

        gl_FragColor = color;

    // === mud（原版 mud.frag 直接复制） ===
    }else if(u_liquidType == 4){
        vec2 coords = vec2(c.x * u_resolution.x + u_campos.x, c.y * u_resolution.y + u_campos.y);

        float btime = u_time / 70000.0;
        float noise = sin((texture2D(u_noise, (coords) / (180.0 / 2.0) + vec2(btime) * vec2(-0.9, 0.8)).r + texture2D(u_noise, (coords) / (180.0 / 2.0) + vec2(abs(sin(btime)) * 1.1) * vec2(-0.8, -1.0)).r) / 2.0);
        vec4 color = tinted;

        if(noise > 0.54 && noise < 0.68){
            color.rgb *= vec3(1.4);
        }else if(!(noise > 0.40 && noise < 0.54)){
            color.rgb *= vec3(1.2);
        }

        gl_FragColor = color;

    // === arkycite（原版 arkycite.frag 直接复制） ===
    }else if(u_liquidType == 5){
        vec2 coords = (c * u_resolution) + u_campos;

        vec4 orig = tinted;

        float atime = u_time / 15000.0;
        float noise = (texture2D(u_noise, (coords) / (160.0 / 2.0) + vec2(atime) * vec2(-0.9, 0.8)).r + texture2D(u_noise, (coords) / (160.0 / 2.0) + vec2(atime * 1.1) * vec2(0.8, -1.0)).r) / 2.0;

        noise = abs(noise - 0.5) * 7.0 + 0.23;

        float btime = u_time / 9000.0;

        vec2 cc = c + (vec2(
            texture2D(u_noise, (coords) / (170.0 / 2.0) + vec2(btime) * vec2(-0.9, 0.8)).r,
            texture2D(u_noise, (coords) / (170.0 / 2.0) + vec2(btime * 1.1) * vec2(0.8, -1.0)).r
        ) - vec2(0.5)) * 20.0 / u_resolution;

        vec4 color = texture2D(u_texture, cc) * v_color;

        if(noise > 0.85){
            if(color.g >= (S2_ARKY).g - 0.1){
                color.rgb = S3_ARKY;
            }else{
                color.rgb = S2_ARKY;
            }
        }else if(noise > 0.5){
            color.rgb = S2_ARKY;
        }

        gl_FragColor = vec4(max(S1_ARKY, color).rgb, orig.a);

    // === 其他液体（neoplasm/oil 等原版无对应 shader，保持原色渲染） ===
    }else{
        gl_FragColor = tinted;
    }
}