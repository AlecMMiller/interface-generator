import { Interfaces } from '@alecmmiller/nestjs-client-generator'
import { ObjectEntries, ObjectEntry } from '@alecmmiller/nestjs-client-generator/dist/interfaces/output/types'

function makeDocs (entry: ObjectEntry): string[] {
  const lines = new Array<string>()

  console.log(entry)

  if (entry.description !== undefined) {
    lines.push(`\t* ${entry.description}`)
  }

  if (entry.example !== undefined) {
    lines.push(`\t* example: ${JSON.stringify(entry.example)}`)
  }

  if (lines.length > 0) {
    lines.unshift('\t/**')
    lines.push('\t*/')
  }

  return lines
}

function makeEntry (entry: ObjectEntry): string[] {
  const fieldName = entry.key
  const fieldType = entry.valueType

  const implementation = `\t${fieldName}: ${fieldType}`

  const docs = makeDocs(entry)

  return [...docs, implementation, '']
}

function makeInterface (name: string, entries: ObjectEntries): string {
  const premable = `interface ${name} {`
  const fields = entries.flatMap(entry => makeEntry(entry))
  const close = '}'
  const output = [premable, ...fields, close].join('\n')
  return output
}

export function generator (representation: Interfaces.ApplicationRepresentation): void {
  const interfaces = Array.from(representation.schema).map(schema => makeInterface(...schema))

  console.log(interfaces[0])
}
