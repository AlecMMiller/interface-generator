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
  const preamble = `interface ${name} {`
  const fields = entries.flatMap(entry => makeEntry(entry))
  fields[fields.length] = '}'
  const output = [preamble, ...fields].join('\n')
  return output
}

export function generator (representation: Interfaces.ApplicationRepresentation): void {
  const interfaces = Array.from(representation.schema).map(schema => makeInterface(...schema))

  const generatedPath = './generated'
  const srcPath = `${generatedPath}/src`
  if (!fs.existsSync(generatedPath)) {
    fs.mkdirSync(generatedPath)
  }

  if (!fs.existsSync(srcPath)) {
    fs.mkdirSync(srcPath)
  }

  fs.writeFileSync(`${generatedPath}/src/index.ts`, interfaces.join('\n'))

  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
  const name = packageJson.name as string
  const license = packageJson.license as string
  const sourceTypescriptVersion = packageJson.devDependencies.typescript as string
  const sourceRepo = packageJson.repository as string
  const version = packageJson.version as string
  const outputPackageName = `${name}-interfaces`

  let repoInfo = ''

  if (sourceRepo !== undefined) {
    repoInfo = ` - see ${sourceRepo} for more information.`
  }

  const outputPackageJson = {
    name: outputPackageName,
    version,
    description: `Auto-generated API interface files for ${name}${repoInfo}`,
    main: 'lib/index.js',
    types: 'lib/index.d.ts',
    license,
    files: [
      'lib/**/*'
    ],
    devDependencies: {
      typescript: sourceTypescriptVersion
    },
    scripts: {
      build: 'tsc'
    }
  }

  fs.writeFileSync(`${generatedPath}/package.json`, JSON.stringify(outputPackageJson, null, 2))

  const outputTsConfig = {
    compilerOptions: {
      module: 'commonjs',
      target: 'es5',
      declaration: true,
      outDir: 'lib',
      strict: true
    }
  }

  fs.writeFileSync(`${generatedPath}/tsconfig.json`, JSON.stringify(outputTsConfig, null, 2))
}
