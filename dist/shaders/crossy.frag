#version 300 es
precision highp float;

in vec4 vertexColor; // An input received from the vertex shader. Since the vertex shader only send 3 colors (one for each vertex), the rasterizer will interpolate the 3 values to get values for the fragments in the middle of the triangle
// Info: the variables sending data between the vertex and fragment shader are called Interpolators
in vec2 v_texcoord;
out vec4 color;
uniform vec4 tint;
uniform sampler2D texture_sampler;

in vec3 v_normal;
in vec3 v_view;
uniform vec3 cam_position;

struct Material {
    vec3 diffuse;
    vec3 specular;
    vec3 ambient;
    float shininess;
};
uniform Material material;

struct DirectionalLight {
    vec3 diffuse;
    vec3 specular;
    vec3 ambient;
    vec3 direction;
};
uniform DirectionalLight light;

float diffuse(vec3 n, vec3 l){
    //Diffuse (Lambert) term computation: reflected light = cosine the light incidence angle on the surface
    //max(0, ..) is used since light shouldn't be negative
    return max(0.0f, dot(n,l));
}

float specular(vec3 n, vec3 l, vec3 v, float shininess){
    //Phong Specular term computation
    return pow(max(0.0f, dot(v,reflect(-l, n))), shininess);
}

void main(){
    vec3 n = normalize(v_normal);
    vec3 v = normalize(v_view);
    vec3 l = -light.direction; // For directional lights, the light vector is the inverse of the light direction
    vec4 LightResult = vec4(
        material.ambient*light.ambient + 
        material.diffuse*light.diffuse*diffuse(n, l) + 
        material.specular*light.specular*specular(n, l, v, material.shininess),
        1.0f
    );
    color = texture(texture_sampler,v_texcoord)*LightResult; // Send our interpolated color
}