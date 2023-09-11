import { Interfaces } from '@alecmmiller/nestjs-client-generator'
import { ObjectEntries, ObjectEntry } from '@alecmmiller/nestjs-client-generator/dist/interfaces/output/types'
import * as fs from 'fs'

function makeDocs (entry: ObjectEntry): string[] {
  const lines = new Array<string>()

  if (entry.description !== undefined) {
    lines.push(`\t* ${entry.description}\n\t*`)
  }

  if (entry.example !== undefined) {
    lines.push(`\t* example: ${JSON.stringify(entry.example)}\n\t*`)
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

  let implementation = `\t${fieldName}: ${fieldType}`
  if (entry?.isArray === true) {
    implementation += '[]'
  }

  const docs = makeDocs(entry)

  return [...docs, implementation, '']
}

function makeInterface (name: string, entries: ObjectEntries): string {
  const premable = `interface ${name} {`
  const fields = entries.flatMap(entry => makeEntry(entry))
  fields[fields.length] = '}'
  const output = [premable, ...fields].join('\n')
  return output
}

export function generator (representation: Interfaces.ApplicationRepresentation): void {
  const interfaces = Array.from(representation.schema).map(schema => makeInterface(...schema))

  const generatedPath = './generated'
  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath)
  }
  fs.writeFileSync(`${generatedPath}/index.ts`, interfaces.join('\n'))
  console.log(interfaces.join('\n'))
}
