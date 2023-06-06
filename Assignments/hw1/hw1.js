// Author: Ernie Chu

window.onload = () => {
  const canvas = document.getElementById('gl-canvas')

  try {
    var gl = WebGLUtils.setupWebGL(canvas)
    if (!gl) { alert('WebGL isn\'t available') }
  } catch (e) {
    alert('Make sure the `Common` WebGL utils are placed in the parent directory.')
  }
  const vertices = new Float32Array(randomIndices(6))
  const vertices2 = new Float32Array(randomIndices(6))

  // Configure WebGL
  gl.viewport(0, 0, canvas.width, canvas.height)
  gl.clearColor(1., 1., 1., 1.)

  // Load shaders and initialize attribute buffers
  const program = initShaders(gl, 'vertex-shader', 'fragment-shader')
  const program2 = initShaders(gl, 'vertex-shader', 'fragment-shader2')

  // Load the data into GPU
  const bufferId = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const bufferId2 = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId2)
  gl.bufferData(gl.ARRAY_BUFFER, vertices2, gl.STATIC_DRAW)

  render(gl, program, bufferId, true)
  render(gl, program2, bufferId2, false)
  
  window.addEventListener('resize', resizeCanvas, false)

  function resizeCanvas () {
    canvas.width = window.innerWidth - 50
    canvas.height = window.innerHeight - 200

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(1., 1., 1., 1.)
    render(gl, program, bufferId, true)
    render(gl, program2, bufferId2, false)
  }

  resizeCanvas()
}

function render (gl, program, id, clear) {
  clear && gl.clear(gl.COLOR_BUFFER_BIT)
  gl.bindBuffer(gl.ARRAY_BUFFER, id)
  
  // Associate out shader variables with our data buffer
  const vPosition = gl.getAttribLocation(program, 'vPosition')
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vPosition)

  gl.useProgram(program)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

function randomIndices (n) {
  const arr = []
  for (let i = 0; i < n; i++) {
    arr.push(Math.random()*2-1)
  }
  return arr
}

