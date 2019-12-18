#version 300 es
layout(location=0) in vec3 position;
layout(location=1) in vec4 color; // We added a new attribute color at the location after position
layout(location=2) in vec2 texcoord;
layout(location=3) in vec3 normal;

out vec4 vertexColor; // Since vertex shaders do not draw, we need to pass the color data to the fragment shader
out vec2 v_texcoord;
out vec3 v_normal;
out vec3 v_view;

uniform mat4 M;
uniform mat4 VP;
uniform mat4 M_it;
uniform vec3 cam_position;

void main(){
    vec4 world = M*vec4(position, 1.0f);
    gl_Position = VP*world;
    vertexColor = color; // Pass the color to the fragment shader
    v_texcoord=texcoord;
    v_normal=(M_it * vec4(normal, 0.0f)).xyz;
    v_view = cam_position - world.xyz;
}