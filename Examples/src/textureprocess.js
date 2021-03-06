

// Copy files required
require('!!file?name=texture.png!../static-files/texture.png')

var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var Shader = GL.Shader
var DEG2RAD = GL.utils.DEG2RAD
var getTime = GL.utils.getTime

//create the rendering context
var container = document.body;

var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
container.appendChild(gl.canvas);
gl.animate();

//build the mesh
var texture_image = GL.Texture.fromURL("texture.png",{temp_color:[80,120,40,255], minFilter: gl.LINEAR_MIPMAP_LINEAR});

var textures = [];
for(var i = 0; i < 4; i++)
    textures.push( new GL.Texture(256,256, {minFilter: gl.LINEAR_MIPMAP_LINEAR, wrap: gl.REPEAT}) );

//generic gl flags and settings
gl.clearColor(0.1,0.1,0.1,1);
gl.disable( gl.DEPTH_TEST );

var swapcolors_shader = GL.Shader.createFX("color = color.bgra;");
var contrast_shader = GL.Shader.createFX("color = (color - vec4(0.5)) * contrast + vec4(0.5);", "uniform float contrast;");
var scroll_shader = GL.Shader.createFX("color = texture2D(u_texture,uv + vec2(time));" , "uniform float time;");
var zoom_shader = GL.Shader.createFX("color = texture2D(u_texture, (uv - vec2(0.5)) * zoom + vec2(0.5));" , "uniform float zoom;");

//rendering loop
gl.ondraw = function()
{
    gl.clear( gl.COLOR_BUFFER_BIT);
    gl.disable( gl.CULL_FACE );

    gl.drawTexture( texture_image, 10,10, 200,200 );

    var time = getTime()*0.001;

    texture_image.copyTo( textures[0], swapcolors_shader );
    textures[0].copyTo( textures[1], contrast_shader.uniforms({contrast: Math.sin(time)*0.5 + 1.0 }) );
    textures[1].copyTo( textures[2], zoom_shader.uniforms({zoom: Math.sin(time) * 2 + 2.2 }) );
    textures[2].copyTo( textures[3], scroll_shader.uniforms({time: time}) );

    gl.enable( gl.CULL_FACE );

    for(var i = 0; i < textures.length; i++)
    {
        gl.drawTexture( textures[i], 10 + 210 * (i+1),10,200,200 );
    }
};
