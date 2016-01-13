
var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;

//create the rendering context
var container = document.body;

var gl = GL.create({width: container.offsetWidth, height: container.offsetHeight});
container.appendChild(gl.canvas);
gl.animate(); //launch loop

//build the mesh
var objects = [];
for(var i = 0; i < 10; i++)
{
    var object = {};
    object.primitive = gl.TRIANGLES;
    object.model = mat4.create();
    mat4.translate( object.model, object.model, [ (i%5) * 3 - 5.5, 0, ((i/5)|0) * -4 + 2] );
    objects.push(object);
}

objects[0].mesh = GL.Mesh.primitives.plane();
objects[1].mesh = GL.Mesh.primitives.plane({xz:true});
objects[2].mesh = GL.Mesh.primitives.circle({xz:true});
objects[3].mesh = GL.Mesh.primitives.cube();
objects[4].mesh = GL.Mesh.primitives.box({sizey:2});
objects[5].mesh = GL.Mesh.primitives.sphere();
objects[6].mesh = GL.Mesh.primitives.sphere({hemi:true});
objects[7].mesh = GL.Mesh.primitives.cylinder({radius:0.5});
objects[8].mesh = GL.Mesh.primitives.grid({size:1});
objects[8].primitive = gl.LINES;
objects[9].mesh = GL.Mesh.primitives.icosahedron({size:1,subdivisions:1});

//create basic matrices for cameras and transformation
var proj = mat4.create();
var view = mat4.create();
var model = mat4.create();
var mvp = mat4.create();
var temp = mat4.create();

//set the camera position
mat4.perspective(proj, 45 * GL.utils.DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 1000);
mat4.lookAt(view, [0,10,10],[0,0,0], [0,1,0]);

//basic phong shader
var shader = new GL.Shader('\
        precision highp float;\
        attribute vec3 a_vertex;\
        attribute vec3 a_normal;\
        varying vec3 v_normal;\
        uniform mat4 u_mvp;\
        uniform mat4 u_model;\
        void main() {\
            v_normal = (u_model * vec4(a_normal,0.0)).xyz;\
            gl_Position = u_mvp * vec4(a_vertex,1.0);\
        }\
        ', '\
        precision highp float;\
        varying vec3 v_normal;\
        uniform vec3 u_lightvector;\
        uniform vec4 u_color;\
        void main() {\
          vec3 N = normalize(v_normal);\
          gl_FragColor = u_color * max(0.0, dot(u_lightvector,N));\
        }\
    ');


//generic gl flags and settings
gl.clearColor(0.1,0.1,0.1,1);
gl.enable( gl.DEPTH_TEST );

var uniforms = {
    u_color: [1,1,1,1],
    u_lightvector: vec3.normalize(vec3.create(),[1,1,1]),
    u_model: model,
    u_mvp: mvp
};

//rendering loop
gl.ondraw = function()
{
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    //create modelview and projection matrices
    for(var i in objects)
    {
        var object = objects[i];
        mat4.multiply(temp,view,object.model);
        mat4.multiply(mvp,proj,temp);

        //render mesh using the shader
        uniforms.u_model = object.model;
        shader.uniforms(uniforms).draw(object.mesh, object.primitive);
    }
};

//update loop
gl.onupdate = function(dt)
{
    //rotate world
    for(var i in objects)
        mat4.rotateY(objects[i].model, objects[i].model, dt*0.2);
};
