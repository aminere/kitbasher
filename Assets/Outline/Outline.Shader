{
  "typeName": "Shader",
  "version": 2,
  "properties": {
    "id": "0202c89f-1a9a-40a6-903b-e81964a65834",
    "name": "Outline",
    "_vertexCode": {
      "typeName": "String",
      "data": "\nattribute vec3 position;\nattribute vec3 normal;\n\nuniform mat4 projectionMatrix;\nuniform mat4 modelViewMatrix;\n\nvoid main() {\n    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal * .02, 1.0);\n}\n"
    },
    "_fragmentCode": {
      "typeName": "String",
      "data": "\nprecision mediump float;\n\nvoid main() {\n    gl_FragColor = vec4(1., 0., 0., 1.);\n}\n"
    }
  }
}