#version 300 es
precision highp float;

struct Material {
    vec3 diffuse;
    vec3 specular;
    vec3 ambient;
    float shininess;
};


struct DirectionalLight {
    vec3 diffuse;
    vec3 specular;
    vec3 ambient;
    vec3 direction;
};

in vec4 vertexColor;
in vec2 v_texcoord;
in vec3 v_normal;
in vec3 v_view;

out vec4 color;

uniform sampler2D texture_sampler;
uniform vec3 cam_position;
uniform Material material;
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
    color = texture(texture_sampler,v_texcoord)*LightResult; // Send our final color
}