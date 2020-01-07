{
  "typeName": "Shader",
  "version": 2,
  "properties": {
    "id": "8fe26a21-7fbc-4cca-8119-005fa6e4da26",
    "name": "DebugShader",
    "_vertexCode": {
      "typeName": "String",
      "data": "attribute vec3 position;\r\nattribute vec2 uv;\r\n\r\nuniform mat4 projectionMatrix;\r\nuniform mat4 modelViewMatrix;\r\n\r\nvarying vec2 vTexCoord;\r\n\r\nvoid main() {\r\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n    vTexCoord = uv;\r\n}\r\n"
    },
    "_fragmentCode": {
      "typeName": "String",
      "data": "precision mediump float;\r\n\r\nuniform vec4 ambient;\r\n\r\nuniform sampler2D diffuse;\r\nvarying vec2 vTexCoord;\r\n \r\nvoid main() {\r\n    vec4 color = texture2D(diffuse, vTexCoord);\r\n    gl_FragColor = ambient * color;\r\n}\r\n"
    }
  }
}