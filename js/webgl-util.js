/* Copyright (c) 2014, Brandon Jones. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation 
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

var WebGLUtil = (function() {

  "use strict";

  var ShaderWrapper = function(gl, program) {
    var i, attrib, uniform, count;

    this.program = program;
    this.attribute = {};
    this.uniform = {};

    count = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (i = 0; i < count; i++) {
      attrib = gl.getActiveAttrib(program, i);
      this.attribute[attrib.name] = gl.getAttribLocation(program, attrib.name);
    }

    count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (i = 0; i < count; i++) {
      uniform = gl.getActiveUniform(program, i);
      this.uniform[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }
  };

  function shaderStringFromScript(selector) {
    var shaderScript = document.querySelector(selector);
    if (!shaderScript) { return null; }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
      if (k.nodeType == 3) {
        str += k.textContent;
      }
      k = k.nextSibling;
    }
    return str;
  }

  var vendorPrefixes = ["", "WEBKIT_", "MOZ_"];

  return {
    getContext: function(canvas, options) {
      if (typeof canvas == "string") {
        canvas = document.querySelector(canvas);
      } 

      var context;
      if (canvas.getContext) {
        try {
          context = canvas.getContext('webgl', options);
          if(context) { return context; }
        } catch(ex) {}
      
        try {
          context = canvas.getContext('experimental-webgl', options);
          if(context) { return context; }
        } catch(ex) {}
      }
    
      return null;
    },

    getExtension: function(gl, name) {
      var i, ext;
      for(i in vendorPrefixes) {
        ext = gl.getExtension(vendorPrefixes[i] + name);
        if (ext) { return ext; }
      }
      return null;
    },

    compileShader: function(gl, source, type) {
      var shaderHeader = "\n";

      var shader = gl.createShader(type);

      gl.shaderSource(shader, shaderHeader + source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    },

    createProgram: function(gl, vertexShaderSource, fragmentShaderSource) {
      var vs = this.compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
      if (!vs) {
        return null;
      }

      var fs = this.compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
      if (!fs) {
        gl.deleteShader(vs);
        return null;
      }

      var shaderProgram = gl.createProgram();
      gl.attachShader(shaderProgram, vs);
      gl.attachShader(shaderProgram, fs);

      gl.linkProgram(shaderProgram);

      // Shader objects are no longer needed after a program has been linked
      gl.deleteShader(vs);
      gl.deleteShader(fs);

      if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error("Program Link error:", gl.getProgramInfoLog(shaderProgram));
        gl.deleteProgram(shaderProgram);
        return null;
      }

      return new ShaderWrapper(gl, shaderProgram);
    },

    createProgramFromTags: function(gl, vertexSelector, fragmentSelector) {
      var vs = shaderStringFromScript(vertexSelector),
          fs = shaderStringFromScript(fragmentSelector);
      return this.createProgram(gl, vs, fs);
    },

    createSolidTexture: function(gl, color) {
      var data = new Uint8Array(color);
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      return texture;
    },
  };
})();