uniform mat4 u_projTrans;

attribute vec4 a_position;
attribute vec4 a_color;
attribute vec2 a_texCoord0;

varying vec4 v_color;
varying vec2 v_texCoords;
varying vec2 v_worldPos;

void main(){
    gl_Position = u_projTrans * a_position;
    v_texCoords = a_texCoord0;
    v_color = a_color;
    v_worldPos = a_position.xy;
}