
var GL = require('../../litegl.js');
var glm = GL.glmatrix, mat3=glm.mat3, mat4=glm.mat4,
    vec2=glm.vec2, vec3=glm.vec3, vec4=glm.vec4, quat=glm.quat;
var Shader = GL.Shader
var DEG2RAD = GL.utils.DEG2RAD

	function init()
	{
		var container = document.body;

		//create the rendering context
		var gl = GL.create({width: container.offsetWidth, height:container.offsetHeight});
		container.appendChild(gl.canvas);
		gl.animate();

		//lorenz attractor vars
		var rho = 28, sigma = 10, beta = 8/3., t = 0.0001;

		//build the mesh
		var offset = 5;
		var num = 50000;
		var size = num * 3;
		var vertices = new Float32Array(size);
		var delta = 100 / size;
		for(var i = 3; i < size; i++)
			vertices[i] = i * delta + (Math.random()-0.5) * delta * 30000;
			//vertices[i] = vertices[i - 3] + Math.random() * offset - offset*0.5; //random increments
		var mesh = GL.Mesh.load({vertices: vertices });

		//create basic matrices for cameras and transformation
		var persp = mat4.create();
		var view = mat4.create();
		var mvp = mat4.create();
		var temp = mat4.create();
		var cam_pos = vec3.fromValues(0,50,-300);
		var center = vec3.create();

		//set the camera position
		mat4.perspective(persp, 45 * GL.utils.DEG2RAD, gl.canvas.width / gl.canvas.height, 0.1, 10000);
		mat4.lookAt(view, cam_pos, center, [0,1,0]);

		var mode = gl.LINES;

        //events
        gl.captureMouse();
        gl.onmousemove = function(e)
        {
            if(e.dragging)
            {
                vec3.rotateY(cam_pos,cam_pos,e.deltax * 0.01);
                vec3.scale(cam_pos,cam_pos,1.0 + e.deltay * 0.01);
            }
        }

        gl.onmouseup = function(e) {
            if(e.click_time < 300)
                mode = (mode == gl.LINE_STRIP ? gl.POINTS : gl.LINE_STRIP );
        };

		//basic rendering shader
		var points_shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				uniform mat4 u_mvp;\
				void main() {\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
					gl_PointSize = 500.0 / gl_Position.z;\
				}\
				', '\
				precision highp float;\
				uniform vec4 u_color;\
				void main() {\
				  float shape = 1.0 - length( gl_PointCoord - vec2(0.5) ) * 2.0;\
				  gl_FragColor = u_color * shape;\
				}\
			');

		var lines_shader = new Shader('\
				precision highp float;\
				attribute vec3 a_vertex;\
				uniform mat4 u_mvp;\
				void main() {\
					gl_Position = u_mvp * vec4(a_vertex,1.0);\
				}\
				', '\
				precision highp float;\
				uniform vec4 u_color;\
				void main() {\
				  gl_FragColor = u_color;\
				}\
			');

		gl.clearColor(0.9,0.9,0.9,1);
		var up = vec3.fromValues(0,1,0);
		var color = vec4.fromValues(0.1,0.1,0.1,0.4);

		//rendering loop
		gl.ondraw = function()
		{
			gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

			mat4.lookAt(view, cam_pos, center, up);
			mat4.multiply(mvp,persp,view);

			gl.enable(gl.BLEND );
			gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
			gl.disable(gl.DEPTH_TEST);

			var shader = points_shader;
			if(mode != gl.POINTS)
				shader = lines_shader;
			shader.uniforms({
				u_color: color,
				u_mvp: mvp
			}).draw(mesh, mode);
			gl.disable(gl.BLEND );
		};

		var temp = vec3.create();
		vec3.zero(center);

		function applyLorenz(vertices)
		{
			for(var i = 0, l = vertices.length; i < l; i += 3)
			{
				var x = vertices[i];
				var y = vertices[i+1];
				var z = vertices[i+2];
				temp[0] = sigma*(y - x) * t;
				temp[1] = (x * (rho - z) - y) * t;
				temp[2] = (x * y - beta * z) * t;
				vertices[i] += temp[0];
				vertices[i+1] += temp[1];
				vertices[i+2] += temp[2];
				center[0] += vertices[i];
				center[1] += vertices[i+1];
				center[2] += vertices[i+2];
			}
		}

		var first_time = true
		//update loop
		gl.onupdate = function(dt)
		{
			//apply lorenz attractor equation to every point

			var time = Date.now() * 0.001;
			//rho = 28 + Math.sin( time ) * 10;
			sigma = 10 + Math.sin( time * 0.1 ) * 3;

			var buffer = mesh.getBuffer("vertices");
			var vertices = buffer.data;

			applyLorenz(vertices);

			//update buffers info
			buffer.upload(gl.DYNAMIC_DRAW);

			//compute the scene center and point the camera to it
			vec3.scale(center, center, 3 / vertices.length);


		};
	}

    init()
