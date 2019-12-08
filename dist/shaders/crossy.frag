#version 300 es
precision highp float;

in vec4 vertexColor; // An input received from the vertex shader. Since the vertex shader only send 3 colors (one for each vertex), the rasterizer will interpolate the 3 values to get values for the fragments in the middle of the triangle
// Info: the variables sending data between the vertex and fragment shader are called Interpolators
in vec2 v_texcoord;
out vec4 color;
uniform vec4 tint;
uniform sampler2D texture_sampler;
void main(){
    color = texture(texture_sampler,v_texcoord)*vertexColor; // Send our interpolated color
}