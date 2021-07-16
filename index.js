var protobuf = require('protocol-buffers-schema')
var mappings = {
  'array': 'repeated',
  'object': 'message',
  'integer': 'int32',
  'number': 'int32',
  'string': 'string',
  'boolean': 'bool'
}

module.exports = function (schema) {
  if (typeof schema === 'string') schema = JSON.parse(schema)
  var result = {
    syntax: 3,
    package: null,
    enums: [],
    messages: []
  }

  const addGlobalMessage = (schema) => {
    result.messages.push(Message(schema, addGlobalMessage))
  }

  if (schema.type === 'object') {
    result.messages.push(Message(schema, addGlobalMessage))
  }

  return protobuf.stringify(result)
}

function Message(schema, addGlobalMessage) {
  var message = {
    name: schema.name,
    enums: [],
    messages: [],
    fields: []
  }

  var tag = 1
  for (var key in schema.properties) {
    var field = schema.properties[key]
    field.name = key
    message.fields.push(Field(field, tag, key, addGlobalMessage))
    tag += 1
  }

  for (var i in schema.required) {
    var required = schema.required[i]
    for (var i in message.fields) {
      var field = message.fields[i]
      if (required === field.name) field.required = true
    }
  }

  return message
}

function Field(field, tag, key, addGlobalMessage) {
  var type = mappings[field.type] || field.type
  var repeated = false

  if (field.type === 'array') {
    repeated = true
    type = field.items.type
  }

  if (type === "object") {

    let name = field.items.name || key
    addGlobalMessage({ ...field.items, name })
    type = name;
  }

  if (field.type === "object") {
    addGlobalMessage({ ...field, name: field.name || key })
  }

  return {
    name: field.name,
    type: type,
    tag: tag,
    repeated: repeated
  }
}
