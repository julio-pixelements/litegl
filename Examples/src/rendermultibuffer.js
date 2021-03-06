
// Copy files required
require('!!file?name=texture.png!../static-files/texture.png')

var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var Shader = GL.Shader
var DEG2RAD = GL.utils.DEG2RAD

//create the rendering context
var gl = GL.create({width: window.innerWidth,height: window.innerHeight});
var container = document.body;
container.appendChild(gl.canvas);
gl.animate();

var camera_position = vec3.fromValues(0,100,100);

//build the mesh
var mesh = GL.Mesh.cube({size:10});
var plane = GL.Mesh.plane({size:400,xz: true});
var sphere = GL.Mesh.sphere({size:50});

var texture = GL.Texture.fromURL("texture.png", { minFilter: gl.LINEAR});

//create G Buffers
var w = (gl.canvas.width*0.5)|0;
var h = (gl.canvas.height*0.5)|0;
var type = gl.FLOAT; //gl.UNSIGNED_BYTE , gl.FLOAT, (or gl.HALF_FLOAT_OES although it doesnt work in firefox)
var texture_color = new GL.Texture(w,h, { type: type, filter: gl.NEAREST });
var texture_normal = new GL.Texture(w,h, { type: type, filter: gl.NEAREST });
var texture_albedo = new GL.Texture(w,h, { type: type, filter: gl.NEAREST });

var textures = [ texture_color, texture_normal, texture_albedo ];
var texture_depth = new GL.Texture(w,h, { format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT, filter: gl.NEAREST });

var fbo = new GL.FBO( textures, texture_depth );

//create basic matrices for cameras and transformation
var proj = mat4.create();
var view = mat4.create();
var viewprojection = mat4.create();
var model = mat4.create();
var mvp = mat4.create();
var temp = mat4.create();
var identity = mat4.create();

//get mouse actions
gl.captureMouse();
gl.onmousemove = function(e)
{
    if(e.dragging)
        mat4.rotateY(model,model,e.deltax * 0.01);
}

//set the camera position
mat4.perspective(proj, 45 * DEG2RAD, gl.canvas.width / gl.canvas.height, 50, 1000);
mat4.lookAt(view, camera_position, [0,0,0], [0,1,0]);

//basic shader
var shader = new Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        attribute vec3 a_normal;\
        attribute vec2 a_coord;\
        varying vec3 v_wPosition;\
        varying vec3 v_normal;\
        varying vec2 v_coord;\
        uniform mat4 u_mvp;\
        uniform mat4 u_model;\
        void main() {\
            v_coord = a_coord;\
            v_wPosition = (u_model * vec4(a_vertex,1.0)).xyz;\
            v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\
            gl_PointSize = 20.0;\
        }\
        ', '\
        \
        #extension GL_EXT_draw_buffers : require \n\
        precision highp float;\
        varying vec3 v_wPosition;\
        varying vec3 v_normal;\
        varying vec2 v_coord;\
        uniform vec3 u_camera_position;\
        uniform vec4 u_color;\
        uniform vec3 u_light_color;\
        uniform vec3 u_light_position;\
        uniform sampler2D u_texture;\
        void main() {\
          vec3 N = normalize(v_normal);\
          vec3 L = normalize(v_wPosition - u_light_position);\
          vec4 diffuse_color = u_color * texture2D( u_texture, v_coord );\
          vec4 final_color = diffuse_color;\
          float depth = 0.002 * length(v_wPosition - u_camera_position);\
          final_color.xyz *= u_light_color * (0.05 + vec3(max(0.0, dot( -L, N ) )));\
          gl_FragData[0] = final_color;\
          gl_FragData[2] = diffuse_color;\
          gl_FragData[1] = vec4(abs(N),1.0);\
          gl_FragData[3] = vec4(vec3(abs(depth)),1.0);\
        }\
    ');

//generic gl flags and settings
gl.clearColor(0.1,0.1,0.1,1);
gl.enable( gl.DEPTH_TEST );

var uniforms = {
    u_texture: 0,
    u_color: [1.0,0.8,0.8,1],
    u_model: model,
    u_mvp: mvp,
    u_light_color: [0.5,0.5,1],
    u_view: view,
    u_camera_position: camera_position,
    u_light_position: [100,100,0]
};


//rendering loop
gl.ondraw = function()
{

    //render something in the texture
    fbo.bind(true);

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.enable( gl.DEPTH_TEST );

    //create modelview and projection matrices
    mat4.multiply( viewprojection, proj, view);
    mat4.multiply( mvp, viewprojection, model);

    texture.bind(0);

    shader.uniforms( uniforms ).draw( plane );
    shader.uniforms( uniforms ).draw( sphere );

    shader.uniforms( uniforms ).draw( sphere, gl.POINTS );

    fbo.unbind();

    gl.disable( gl.DEPTH_TEST );

    gl.drawTexture(texture_color, 0,0, gl.canvas.width * 0.5, gl.canvas.height * 0.5);
    gl.drawTexture(texture_normal, gl.canvas.width * 0.5,0, gl.canvas.width * 0.5, gl.canvas.height * 0.5);
    gl.drawTexture(texture_albedo, 0, gl.canvas.height * 0.5, gl.canvas.width * 0.5, gl.canvas.height * 0.5);
    gl.drawTexture(texture_depth, gl.canvas.width * 0.5, gl.canvas.height * 0.5, gl.canvas.width * 0.5, gl.canvas.height * 0.5);
};

//update loop
gl.onupdate = function(dt)
{
    //rotate cube
    mat4.rotateY(model,model,dt*0.2);
};
