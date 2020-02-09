var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 vertTexCoord; 
  attribute vec4 a_Normal;    

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;
  
  varying vec2 fragTexCoord;

  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjMatrix;
  uniform vec3 u_LightColor;   
  uniform vec3 u_LightDirection; // Light direction (in the world coordinate, normalized)
  uniform bool u_isLighting;
  void main() {
    gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    if(u_isLighting) 
    {
       vec3 normal = normalize((u_NormalMatrix * a_Normal).xyz);
       float nDotL = max(dot(normal, u_LightDirection), 0.0);
        // Calculate the color due to diffuse reflection
       
       //vec3 diffuse = u_LightColor * vertTexCoord.rgb * nDotL;
       //fragTexCoord = vec2(diffuse, vertTexCoord.a);    
      }
    else
    {
       fragTexCoord = vertTexCoord;
    } 
  }
`;

// Fragment shader program
var FSHADER_SOURCE = `
  precision mediump float;
  varying vec2 fragTexCoord;
  uniform sampler2D sampler;
  void main() {
    gl_FragColor = texture2D(sampler, fragTexCoord);
  }
`;

var modelMatrix = new Matrix4(); // The model matrix
var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals
var viewMatrix = new Matrix4();  // The view matrix
var projMatrix = new Matrix4();  // The projection matrix


var ANGLE_STEP = 3.0;  // The increments of rotation angle (degrees)
var g_xAngle = 0.0;    // The rotation x angle (degrees)
var g_yAngle = 0.0;    // The rotation y angle (degrees)

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
  
  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Get the storage locations of uniform attributes
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');

  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightDirection = gl.getUniformLocation(gl.program, 'u_LightDirection');


  var u_isLighting = gl.getUniformLocation(gl.program, 'u_isLighting'); 

 
  gl.uniform3f(u_LightColor, 2.0, 2.0, 2.0);


  var lightDirection = new Vector3([0.5, 3.0, 4.0]);
  lightDirection.normalize();     // Normalize
  gl.uniform3fv(u_LightDirection, lightDirection.elements);

  // Calculate the view matrix and the projection matrix
  viewMatrix.setLookAt(0, 0, 15, 0, 0, -100, 0, 1, 0);
  projMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  // Pass the model, view, and projection matrix to the uniform variable respectively
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMatrix.elements);
  gl.uniformMatrix4fv(u_ProjMatrix, false, projMatrix.elements);

  var boxTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, boxTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,
    gl.UNSIGNED_BYTE, document.getElementById('wood')
  );
  gl.bindTexture(gl.TEXTURE_2D, null);



  document.onkeydown = function(ev){
    keydown(ev);
  };

  function radToDeg(r) {
    return r * 180 / Math.PI;
  }

  function degToRad(d) {
    return d * Math.PI / 180;
  }
  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    g_yAngle = (g_yAngle + 1) % 360;
    g_xAngle = (g_xAngle + 1) % 360
    draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, boxTexture);
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

//keyboard functionality
function keydown(ev) {
  switch (ev.keyCode) {
    case 40: // Up arrow key -> the positive rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle + ANGLE_STEP) % 360;
      break;
    case 38: // Down arrow key -> the negative rotation of arm1 around the y-axis
      g_xAngle = (g_xAngle - ANGLE_STEP) % 360;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_yAngle = (g_yAngle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }
}

// square vertices
function initVertexBuffersCube(gl) {
  // Create a cube
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var vertices = new Float32Array([   // Coordinates
     0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5, // v0-v1-v2-v3 front
     0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5, // v0-v3-v4-v5 right
     0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5, // v0-v5-v6-v1 up
    -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5, // v1-v6-v7-v2 left
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5, // v7-v4-v3-v2 down
     0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5  // v4-v7-v6-v5 back
  ]);

  var vertices = new Float32Array([   // Coordinates
    0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,  -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,
    0.5, 0.5, 0.5,   0.5,-0.5, 0.5,   0.5,-0.5,-0.5,   0.5, 0.5,-0.5,
    0.5, 0.5, 0.5,   0.5, 0.5,-0.5,  -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,
   -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,
   -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
    0.5,-0.5,-0.5,  -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
 ]);

  var texcoords = new Float32Array([
    1, 1, 0, 1, 0, 0, 1, 0,
    1, 1, 0, 1, 0, 0, 0, 1,
    1, 1, 1, 0, 0, 0, 0, 1,
    0, 0, 0, 1, 1, 1, 1, 0,
    1, 1, 0, 1, 0, 0, 1, 0,
    0, 1, 1, 1, 1, 0, 0, 0,
  ])

  /* var colors = new Float32Array([    // Colors
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
 ]); */

  var normals = new Float32Array([    // Normal
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);


  // Indices of the vertices, from which things are built from triangle
  // 1_________2
  // |        /|
  // |      /  |
  // |    /    |
  // |  /      |
  // |/________|
  // 0         3
  // A clockwise arrangement, as it were starting bottom left
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
 ]);


  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'vertTexCoord', texcoords, 3, gl.FLOAT)) return -1; // BINGO, change a color and colors
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initVertexBuffersPrism(gl) {
  var vertices = new Float32Array([
    -0.5, -0.5, 0.5,  0.5, -0.5, 0.5,  0.5, 0.5, 0.5, // v1-v2-v3
    -0.5, -0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, -0.5,  -0.5, -0.5, -0.5, // v1-v3-v4-v5
    -0.5, -0.5, 0.5,  0.5, -0.5, 0.5, 0.5, -0.5, -0.5,  -0.5, -0.5, -0.5, // v1-v2-v6-v5
    0.5, -0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5, -0.5,  0.5, -0.5, -0.5, // v2-v3-v4-v6
    -0.5, -0.5, -0.5,  0.5, -0.5, -0.5,  0.5, 0.5, -0.5 // v5-v6-v4
  ]);
  
  var normals = new Float32Array([
      0, 0, 1,  0, 0, 1,  0, 0, 1,
      -1, 1, 0,  -1, 1, 0,  -1, 1, 0,  -1, 1, 0,
      0, -1, 0,  0, -1, 0,  0, -1, 0,  0, -1, 0,
      1, 0, 0,  1, 0, 0,  1, 0, 0,  1, 0, 0,
      0, 0, -1,  0, 0, -1,  0, 0, -1
  ]);
  
  var indices = new Uint8Array([
    0, 1, 2, 
    3, 4, 5,   3, 5, 6,
    7, 8, 9,   7, 9, 10,
    11, 12, 13, 11, 13, 14,
    15, 16, 17  
  ]);

  var colors = new Float32Array([    // Colors
    0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0,  
    0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0, 
    0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0, 
    0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0, 
    0, 1, 0,   0, 1, 0,   0, 1, 0,  0, 1, 0　    
 ]);

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'vertTexCoord', colors, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer (gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return true;
}

var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

function draw(gl, u_ModelMatrix, u_NormalMatrix, u_isLighting, texture) {

  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform1i(u_isLighting, false);
  
  var n = initVertexBuffersCube(gl);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform1i(u_isLighting, true); 
  //chair
  //x,y,z 
  // Rotate, and then translate
  modelMatrix.setTranslate(0, 0, -5);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  //modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  // Model the chair seat
  pushMatrix(modelMatrix);
    modelMatrix.scale(2.0, 0.4, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  // Model the chair back
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 1.20, -0.8);  // Translation
    modelMatrix.scale(2.0, 2.2, 0.4); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  //As if you were sitting on the chair;
  //Back right leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(-2.6,-0.4,-2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  //Back left leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(2.6,-0.4,-2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  //Front right leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(-2.6,-0.4,2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();
  
  //Front left leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(2.6,-0.4,2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();
  
  /////////////////////////////////Create the room////////////////////////////////////////////////
  gl.uniform1i(u_isLighting, false); 
  var n = initVertexBuffersCube(gl);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform1i(u_isLighting, true); 

  modelMatrix.setTranslate(0, 0, 0);  // Translation (No translation is supported here)

  //Floor
  pushMatrix(modelMatrix);
    modelMatrix.scale(50,0.2,50); // Scale
    modelMatrix.translate(0,-10,0);
    
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  ////////////////////////////////Table///////////////////////////////////

  gl.uniform1i(u_isLighting, false); 
  var n = initVertexBuffersCube(gl);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.uniform1i(u_isLighting, true); 

  // Rotate, and then translate
  modelMatrix.setTranslate(3, 0, -1);  // Translation (No translation is supported here)
  modelMatrix.rotate(g_yAngle, 0, 1, 0); // Rotate along y axis
  //modelMatrix.rotate(g_xAngle, 1, 0, 0); // Rotate along x axis

  // Model the chair seat
  pushMatrix(modelMatrix);
    modelMatrix.scale(2.0, 0.4, 2.0); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  // Model the chair back
  pushMatrix(modelMatrix);
    modelMatrix.translate(0, 1.20, -0.8);  // Translation
    modelMatrix.scale(2.0, 2.2, 0.4); // Scale
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  //As if you were sitting on the chair;
  //Back right leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(-2.6,-0.4,-2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  //Back left leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(2.6,-0.4,-2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

  //Front right leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(-2.6,-0.4,2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();
  
  //Front left leg
  pushMatrix(modelMatrix);
    modelMatrix.scale(0.3, 1.9, 0.3);
    modelMatrix.translate(2.6,-0.4,2.6)
    drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture);
  modelMatrix = popMatrix();

}

function drawbox(gl, u_ModelMatrix, u_NormalMatrix, n, texture) {
    // Pass the model matrix to the uniform variable
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(modelMatrix); //set the normal matrix as the inverse of the current model
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.activeTexture(gl.TEXTURE0);
  gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
}